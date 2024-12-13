var app = angular.module("myApp", []);
app.controller("CheckLogin", function ($scope, $http, $window) {
  // Khởi tạo thông tin người dùng và trạng thái đăng nhập
  $scope.isLoggedIn = false;
  $scope.user = {
    idaccount: "",
    password: "",
  };
  $scope.loginError = ""; // Biến để lưu thông báo lỗi

  // Kiểm tra trạng thái đăng nhập từ localStorage
  if (localStorage.getItem("loggedInUser")) {
    $scope.isLoggedIn = true;
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  } else {
    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    $window.location.href = "login.html"; // Đường dẫn đến trang đăng nhập
  }

  // Hàm cập nhật giao diện
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
  };

  // Phương thức đăng nhập
  $scope.login = function () {
    if (!$scope.isLoggedIn) {
      $scope.loginError = ""; // Reset thông báo lỗi

      // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
      $http
        .get("http://localhost:8080/beesixcake/api/account")
        .then(function (response) {
          $scope.accounts = response.data;
          var foundAccount = $scope.accounts.find(
            (account) =>
              account.idaccount === $scope.user.idaccount &&
              account.password === $scope.user.password
          );

          if (foundAccount) {
            if (foundAccount.admin) {
              // Nếu tài khoản là admin
              $scope.loginError = "Bạn không có quyền truy cập!";
            } else {
              // Đăng nhập thành công
              $scope.loginSuccess = "Đăng nhập thành công!";
              // Lưu thông tin đăng nhập vào localStorage
              localStorage.setItem(
                "loggedInUser",
                JSON.stringify(foundAccount)
              );

              // Cập nhật giao diện
              $scope.updateAccountMenu();

              // Chuyển hướng về trang chính ngay lập tức
              $window.location.href = "index.html"; // Hoặc sử dụng $timeout nếu cần delay
            }
          } else {
            // Nếu tài khoản không đúng hoặc mật khẩu không khớp
            $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
          }
        })
        .catch(function (error) {
          // Xử lý lỗi từ API
          $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
          console.error("Error:", error);
        });
    } else {
      alert("Bạn đã đăng nhập rồi.");
    }
  };

  // Phương thức đăng xuất
  $scope.logout = function () {
    localStorage.removeItem("loggedInUser");
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
    $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
  };
});

app.controller("Admin-oder", [
  "$scope",
  "$http",
  "$q",
  "$window",
  function ($scope, $http, $q, $window) {
    // Khởi tạo các biến cần thiết
    $scope.Products = [];
    $scope.selectedProduct = {
      category: null,
      sizes: [],
    };
    $scope.categories = [];
    $scope.sizes = [];
    $scope.message = "";
    $scope.messageType = "";
    $scope.isEditMode = false;
    $scope.originalSizes = [];

    // Phân trang
    $scope.currentPage = 1;
    $scope.itemsPerPage = 10;
    $scope.totalPages = 1;
    $scope.pages = [];
    $scope.paginatedProducts = [];

    // Giỏ hàng
    $scope.cart = [];
    $scope.totalPrice = 0;
    $scope.voucherDiscount = 0;
    $scope.shippingFee = 0; // Phí vận chuyển mặc định
    $scope.finalTotal = 0;
    $scope.currentDiscount = null;
    $scope.discountCode = "";
    $scope.discountError = "";
    $scope.discountSuccess = "";

    // Phương thức thanh toán
    $scope.payments = [];
    $scope.selectedPayment = null;
    $scope.selectedPaymentId = null;

    // Thông tin thanh toán qua chuyển khoản
    $scope.qrCodeGenerated = false;
    $scope.paymentStatus = "PENDING";
    $scope.countdown = 0;
    $scope.countdownDisplay = "";
    if (localStorage.getItem("loggedInUser")) {
      var loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
      $scope.fullname = loggedInUser.fullname;
      $scope.phone = loggedInUser.phonenumber;
      $scope.userId = loggedInUser.idaccount;
    } else {
      console.warn(
        "Người dùng chưa đăng nhập. Chuyển hướng đến trang đăng nhập."
      );
      $window.location.href = "login.html";
      return;
    }
    // Load các dữ liệu ban đầu
    $scope.loadInitialData = function () {
      $scope.loadCategories();
      $scope.loadSizes();
      $scope.loadProducts();
      $scope.loadPayments();
      $scope.loadCartFromLocalStorage();
    };

    // Load sản phẩm từ API
    $scope.loadProducts = function () {
      $q.all([
        $http.get("http://localhost:8080/beesixcake/api/productdetail"),
        $http.get("http://localhost:8080/beesixcake/api/favorites"),
      ])
        .then(function (responses) {
          var productDetails = responses[0].data;
          var favorites = responses[1].data;

          // Tạo một map để lưu số lượng yêu thích cho mỗi sản phẩm
          var favoriteCountMap = {};

          favorites.forEach(function (fav) {
            var productId = fav.product.idproduct;
            if (!favoriteCountMap[productId]) {
              favoriteCountMap[productId] = 0;
            }
            favoriteCountMap[productId]++;
          });

          var productsMap = {};
          $scope.Products = [];

          productDetails.forEach(function (detail) {
            var productId = detail.product.idproduct;

            if (!productsMap[productId]) {
              productsMap[productId] = {
                idproduct: detail.product.idproduct,
                productname: detail.product.productname,
                category: detail.product.category,
                description: detail.product.description,
                img: detail.product.img,
                isactive: detail.product.isactive,
                favorite: favoriteCountMap[productId] || 0, // Gán số lượng yêu thích
                sizes: [],
              };
              $scope.Products.push(productsMap[productId]);
            }

            productsMap[productId].sizes.push({
              idproductdetail: detail.idproductdetail,
              idsize: detail.size.idsize,
              sizename: detail.size.sizename,
              unitprice: detail.unitprice,
              quantityinstock: detail.quantityinstock,
            });
          });

          // Sắp xếp danh sách sản phẩm theo idproduct giảm dần
          $scope.Products.sort(function (a, b) {
            return b.idproduct - a.idproduct;
          });

          // Chọn kích thước đầu tiên cho mỗi sản phẩm và gán giá trị cho selectedQuantity
          $scope.Products.forEach(function (product) {
            if (product.sizes && product.sizes.length > 0) {
              var firstSize = product.sizes[0];
              product.selectedSize = firstSize;
              product.unitprice = firstSize.unitprice;
              product.quantityinstock = firstSize.quantityinstock;
              product.selectedQuantity = 1;
            }
          });

          // Sau khi tải xong sản phẩm, gọi filterByCategory để lọc theo loại đã chọn (nếu có)
          $scope.filterByCategory();
        })
        .catch(function (error) {
          console.error("Error loading products or favorites:", error);
          $scope.message = "Lỗi khi tải sản phẩm hoặc yêu thích.";
          $scope.messageType = "error";
        });
    };

    // Load danh mục từ API
    $scope.loadCategories = function () {
      $http
        .get("http://localhost:8080/beesixcake/api/category")
        .then(function (response) {
          $scope.categories = response.data;
        })
        .catch(function (error) {
          console.error("Error loading categories:", error);
          $scope.message = "Lỗi khi tải danh mục.";
          $scope.messageType = "error";
        });
    };

    // Load kích thước từ API
    $scope.loadSizes = function () {
      $http
        .get("http://localhost:8080/beesixcake/api/size")
        .then(function (response) {
          $scope.sizes = response.data.map(function (size) {
            size.isSelected = false;
            size.unitprice = null;
            size.quantityinstock = null;
            return size;
          });
        })
        .catch(function (error) {
          console.error("Error loading sizes:", error);
          $scope.message = "Lỗi khi tải kích thước.";
          $scope.messageType = "error";
        });
    };

    // Load phương thức thanh toán từ API
    $scope.loadPayments = function () {
      $http
        .get("http://localhost:8080/beesixcake/api/payment")
        .then(function (response) {
          $scope.payments = response.data;
          $scope.selectedPayment = $scope.payments[0];
          $scope.selectedPaymentId = $scope.selectedPayment.idpayment;
        })
        .catch(function (error) {
          console.error("Error loading payments:", error);
          $scope.message = "Lỗi khi tải phương thức thanh toán.";
          $scope.messageType = "error";
        });
    };




    $scope.filterByCategory = function () {
      // Kiểm tra nếu dữ liệu sản phẩm không tồn tại
      if (!$scope.Products || $scope.Products.length === 0) {
          $scope.filteredProducts = [];
          $scope.updatePagination();
          return;
      }
  
      // Thực hiện lọc sản phẩm
      $scope.filteredProducts = $scope.Products.filter(function (product) {
          // Lọc theo danh mục (nếu có chọn danh mục)
          let matchesCategory =
              !$scope.selectedCategory || 
              product.category.idcategory == $scope.selectedCategory;
  
          // Lọc theo từ khóa tìm kiếm (nếu có nhập từ khóa)
          let matchesSearchQuery =
              !$scope.searchQuery ||
              product.productname
                  .toLowerCase()
                  .includes($scope.searchQuery.toLowerCase());
  
          // Lọc theo giá tối đa (nếu có nhập giá)
          let matchesMaxPrice =
              !$scope.maxPrice || product.unitprice <= $scope.maxPrice;
  
          // Sản phẩm phải thỏa mãn tất cả điều kiện
          return matchesCategory && matchesSearchQuery && matchesMaxPrice;
      });
  
      // Cập nhật số lượng sản phẩm sau khi lọc
      $scope.productCount = $scope.filteredProducts.length;
  
      // Ghi log nếu không có sản phẩm phù hợp
      if ($scope.filteredProducts.length === 0) {
          console.log("Không có sản phẩm nào phù hợp với bộ lọc hiện tại.");
      } else {
          console.log(
              `Đã tìm thấy ${$scope.filteredProducts.length} sản phẩm phù hợp.`
          );
      }
  
      // Cập nhật phân trang sau khi lọc
      $scope.updatePagination();
  };
  

    // Watch để cập nhật phân trang khi Products hoặc searchQuery thay đổi
    $scope.$watchGroup(
      ["Products", "searchQuery"],
      function (newValues, oldValues) {
        $scope.currentPage = 1;
        $scope.updatePagination();
      }
    );

    // Hàm thêm sản phẩm vào giỏ hàng
    $scope.addToCart = function (product) {
      if (product.selectedQuantity > product.quantityinstock) {
        $scope.showModal("Thông báo", "Hết Hàng. Sản phẩm hiện không còn trong kho");
        return;
      }

      var index = $scope.cart.findIndex(
        (item) =>
          item.productname === product.productname &&
          item.selectedSize.sizename === product.selectedSize.sizename
      );

      if (index === -1) {
        product.isAdded = true;
        $scope.cart.push({
          productname: product.productname,
          img: product.img,
          selectedSize: product.selectedSize,
          selectedQuantity: product.selectedQuantity,
          unitprice: product.unitprice,
          totalPrice: product.selectedQuantity * product.unitprice,
          idproductdetail: product.selectedSize.idproductdetail,
          idcartitem: product.idproduct, // Giả sử idcartitem là idproduct
        });
      } else {
        product.isAdded = false;
        $scope.cart.splice(index, 1);
      }

      $scope.updateCart();
      $scope.calculateTotals();
      $scope.saveCartToLocalStorage();
    };

    // Cập nhật giỏ hàng
    $scope.updateCart = function () {
      $scope.totalPrice = 0;
      angular.forEach($scope.cart, function (item) {
        $scope.totalPrice += item.totalPrice;
      });
    };

    // Lưu giỏ hàng vào localStorage
    $scope.saveCartToLocalStorage = function () {
      localStorage.setItem("adminCart", JSON.stringify($scope.cart));
    };

    // Load giỏ hàng từ localStorage
    $scope.loadCartFromLocalStorage = function () {
      const savedCart = JSON.parse(localStorage.getItem("adminCart"));
      if (savedCart && savedCart.length > 0) {
        $scope.cart = savedCart;
        $scope.updateCart();
        $scope.calculateTotals();
      }
    };


// Cập nhật giá và số lượng khi thay đổi size
$scope.onSizeChange = function (product, selectedSize) {
  if (selectedSize) {
    product.unitprice = selectedSize.unitprice;
    product.quantityinstock = selectedSize.quantityinstock;
    product.selectedQuantity = 1; // Đặt lại số lượng khi thay đổi size
  }
};

$scope.onQuantityChange = function (product) {
  // Kiểm tra nếu số lượng nhập vào không phải là một số hợp lệ
  if (isNaN(product.selectedQuantity) || product.selectedQuantity < 1) {
    // Hiển thị modal thông báo lỗi
    $scope.showModal("Thông báo", "Số lượng sản phẩm không đủ trong kho!");
    product.selectedQuantity = 1; // Đặt lại số lượng về 1 nếu không hợp lệ
  } else if (product.selectedQuantity > product.selectedSize.quantityinstock) {
    // Hiển thị modal thông báo lỗi nếu số lượng nhập vượt quá số lượng trong kho
    $scope.showModal("Lỗi", "Số lượng sản phẩm không đủ trong kho!");
    product.selectedQuantity = product.selectedSize.quantityinstock; // Đặt lại số lượng theo tồn kho
  }
  // Cập nhật giỏ hàng sau khi thay đổi số lượng
  $scope.updateCart();
  $scope.calculateTotals();
};





        // Cập nhật phân trang
        $scope.updatePagination = function () {
          let productsToPaginate = $scope.filteredProducts || $scope.Products;
          $scope.totalPages =
            Math.ceil(productsToPaginate.length / $scope.itemsPerPage) || 1;
          $scope.pages = [];
          for (let i = 1; i <= $scope.totalPages; i++) {
            $scope.pages.push(i);
          }
          if ($scope.currentPage > $scope.totalPages) {
            $scope.currentPage = $scope.totalPages;
          }
          let start = ($scope.currentPage - 1) * $scope.itemsPerPage;
          let end = start + $scope.itemsPerPage;
          $scope.paginatedProducts = productsToPaginate.slice(start, end);
        };
    
        // Chuyển trang
        $scope.goToPage = function (page) {
          if (page < 1 || page > $scope.totalPages) {
            return;
          }
          $scope.currentPage = page;
          $scope.updatePagination();
        };
    
    // Tính tổng tiền
    $scope.calculateTotals = function () {
      $scope.totalPrice = $scope.cart.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      $scope.voucherDiscount = $scope.currentDiscount
        ? ($scope.totalPrice * $scope.currentDiscount.discountpercentage) / 100
        : 0;
      $scope.finalTotal =
        $scope.totalPrice + ($scope.shippingFee || 0) - $scope.voucherDiscount;
    };

    // Xử lý mã giảm giá
    $scope.applyDiscountCode = function () {
      $scope.discountError = "";
      $scope.discountSuccess = "";

      const code = $scope.discountCode.trim().toUpperCase();
      if (!code) {
        $scope.discountError = "Vui lòng nhập mã giảm giá.";
        return;
      }

      $http
        .get(`http://localhost:8080/beesixcake/api/discount/code/${code}`)
        .then(function (response) {
          const discount = response.data;

          // Lấy thời gian hiện tại theo UTC+7
          const now = new Date();
          const utc7Now = new Date(
            now.getTime() + (7 - now.getTimezoneOffset() / 60) * 3600000
          );

          // Chuyển ngày bắt đầu và ngày kết thúc sang đối tượng Date (UTC+7)
          const startDate = new Date(
            new Date(discount.startdate).getTime() + 7 * 3600000
          );
          const endDate = new Date(
            new Date(discount.enddate).getTime() + 7 * 3600000
          );

          // Kiểm tra ngày áp dụng
          if (utc7Now < startDate) {
            $scope.discountError = "Mã này chưa đến thời gian được áp dụng.";
            return;
          } else if (utc7Now > endDate) {
            $scope.discountError = "Mã giảm giá đã hết hạn.";
            return;
          }

          // Kiểm tra điều kiện tổng tiền
          if ($scope.totalPrice < discount.lowestprice) {
            $scope.discountError =
              "Đơn hàng không đủ điều kiện để sử dụng mã giảm giá này.";
          } else {
            $scope.currentDiscount = discount;
            $scope.voucherDiscount =
              ($scope.totalPrice * discount.discountpercentage) / 100;
            $scope.finalTotal =
              $scope.totalPrice +
              ($scope.shippingFee || 0) -
              $scope.voucherDiscount;
            $scope.discountSuccess = `Áp dụng mã giảm giá ${code} thành công!`;
            $scope.calculateTotals();
          }
        })
        .catch(() => {
          $scope.discountError = "Mã giảm giá không tồn tại.";
        });
    };

    // Hủy mã giảm giá
    $scope.cancelDiscountCode = function () {
      $scope.discountError = "";
      $scope.discountSuccess = "";

      $scope.currentDiscount = null;
      $scope.voucherDiscount = 0;
      $scope.finalTotal = $scope.totalPrice + ($scope.shippingFee || 0);
      $scope.discountSuccess = "Mã giảm giá đã được hủy.";

      $scope.calculateTotals();
    };

    // Xử lý thanh toán qua chuyển khoản
    $scope.qrCodeGenerated = false;
    $scope.paymentStatus = "PENDING";
    $scope.countdown = 0;

    // Hàm tạo mã QR
    $scope.generateQRCode = function () {
      const randomChars = Array(3)
        .fill(null)
        .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))) // Random 3 ký tự chữ (A-Z)
        .join("");

      const qrRequest = {
        productName: "HÓA ĐƠN BEESIXCAKE",
        description: "", // Nội dung chuyển khoản sẽ cập nhật sau khi gọi API
        returnUrl: "admin_order.html", // URL trả về sau khi thanh toán
        cancelUrl: "admin_order.html", // URL hủy thanh toán
        price: $scope.finalTotal, // Tổng tiền
      };

      $http
        .post("http://localhost:8080/beesixcake/qr/order/create", qrRequest)
        .then(function (response) {
          if (response.data.error === 0) {
            const qrData = response.data.data;

            // Gán dữ liệu từ API trả về
            $scope.orderCode = qrData.orderCode; // Lưu lại orderCode để kiểm tra
            $scope.accountNumber = qrData.accountNumber;
            $scope.accountName = qrData.accountName;
            $scope.description = `${randomChars}${qrData.orderCode}`; // Nội dung chuyển khoản
            $scope.qrCodeUrl = `https://img.vietqr.io/image/${qrData.bin}-${
              qrData.accountNumber
            }-vietqr_pro.jpg?addInfo=${encodeURIComponent(
              $scope.description
            )}&amount=${qrData.amount}`;
            $scope.qrCodeGenerated = true; // Hiển thị thông tin thanh toán
            $scope.startCountdown(); // Bắt đầu đếm ngược

            // Bắt đầu kiểm tra trạng thái thanh toán
            $scope.checkPaymentStatus(qrData.orderCode);

            console.log(
              `Thanh toán thành công! Link thanh toán: ${qrData.checkoutUrl}`
            ); // In ra console
          } else {
            $scope.showModal("Lỗi khi tạo mã QR", response.data.message);
          }
        })
        .catch(function (error) {
          console.error("Lỗi API khi tạo mã QR:", error);
          $scope.showModal("Lỗi", "Không thể kết nối đến API để tạo mã QR.");
        });
    };

    // Hàm kiểm tra trạng thái thanh toán
    $scope.checkPaymentStatus = function (orderCode) {
      $scope.paymentCheckTimer = setInterval(() => {
        $http
          .get(`http://localhost:8080/beesixcake/qr/order/${orderCode}`)
          .then(function (response) {
            console.log("Payment Status Response:", response.data);

            if (response.data.error === 0) {
              const paymentData = response.data.data;

              // Nếu trạng thái thanh toán là "PAID"
              if (paymentData.status === "PAID") {
                console.log("Thanh toán thành công:", paymentData);

                // Cập nhật trạng thái thanh toán
                $scope.paymentStatus = "PAID";

                // Dừng kiểm tra
                clearInterval($scope.paymentCheckTimer);

                // Gọi hàm đặt hàng
                $scope.placeOrder();
              }
            } else {
              console.warn(
                "Lỗi khi kiểm tra thanh toán:",
                response.data.message
              );
            }
          })
          .catch(function (error) {
            console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
          });
      }, 5000); // Kiểm tra mỗi 5 giây
    };

    // Hàm bắt đầu đếm ngược 15 phút
    $scope.startCountdown = function () {
      $scope.countdown = 900; // 15 phút tính theo giây (15 * 60)
      $scope.timer = setInterval(() => {
        if ($scope.countdown > 0) {
          $scope.countdown -= 1;
          $scope.countdownDisplay = $scope.formatTime($scope.countdown);
          $scope.$apply(); // Cập nhật giao diện
        } else {
          $scope.stopCountdown();
          $scope.cancelPayment();
          $scope.showModal(
            "Hết thời gian thanh toán",
            "Thanh toán đã hết thời gian. Đơn hàng tự động hủy."
          );
        }
      }, 1000);
    };

    // Hàm dừng đếm ngược
    $scope.stopCountdown = function () {
      clearInterval($scope.timer);
    };

    // Hàm định dạng thời gian từ giây thành "phút:giây"
    $scope.formatTime = function (seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    };

    // Hàm hủy thanh toán
    $scope.cancelPayment = function () {
      $scope.qrCodeGenerated = false; // Ẩn QR Code
      $scope.accountNumber = null;
      $scope.accountName = null;
      $scope.description = null;
      $scope.qrCodeUrl = null;
      $scope.stopCountdown(); // Dừng đếm ngược
      $scope.showModal("Thanh toán hủy bỏ", "Thanh toán đã được hủy.");
    };

    // Hàm hiển thị modal thông báo
    $scope.showModal = function (title, message) {
      $scope.modalTitle = title;
      $scope.modalMessage = message;
      const modalElement = document.getElementById("infoModal");
      const modal = new bootstrap.Modal(modalElement, {
        backdrop: "static", // Không cho phép đóng bằng cách nhấp ngoài
        keyboard: false, // Không cho phép đóng bằng phím Esc
      });
      modal.show();
    };

    // Hàm tạo đơn hàng
    $scope.placeOrder = function () {
      if ($scope.cart.length === 0) {
        $scope.showModal("Lỗi", "Không thể đặt hàng vì giỏ hàng trống.");
        return;
      }

      // Tạo đối tượng đơn hàng
      const order = {
        orderdate: new Date().toISOString(),
        shipfee: $scope.shippingFee,
        total: $scope.finalTotal,
        discount: $scope.currentDiscount || { iddiscount: 0 },
        payment: { idpayment: $scope.selectedPaymentId },
        statuspay: { idstatuspay: 2 },
        account: { idaccount: $scope.userId },
        addressdetail: "Không",
      };

      // Gửi yêu cầu tạo đơn hàng
      $http
        .post("http://localhost:8080/beesixcake/api/order", order)
        .then(function (response) {
          const createdOrder = response.data;
          console.log("Đơn hàng được tạo:", createdOrder);

          // Tạo chi tiết đơn hàng
          $scope.createOrderDetails(createdOrder);
        })
        .catch(function (error) {
          console.error("Lỗi khi tạo đơn hàng:", error);
          $scope.showModal("Lỗi", "Không thể tạo đơn hàng. Vui lòng thử lại.");
        });
    };

    // Hàm tạo chi tiết đơn hàng
    $scope.createOrderDetails = function (createdOrder) {
      const promises = $scope.cart.map((item) => {
        const orderDetail = {
          quantity: item.selectedQuantity,
          order: { idorder: createdOrder.idorder },
          productdetail: { idproductdetail: item.idproductdetail },
        };

        return $http.post(
          "http://localhost:8080/beesixcake/api/orderdetail",
          orderDetail
        );
      });

      $q.all(promises)
        .then(function () {
          console.log("Tạo chi tiết đơn hàng thành công.");
          // Cập nhật tồn kho sản phẩm
          return $scope.updateProductStock();
        })
        .then(function () {
          // Tạo lịch sử trạng thái đơn hàng
          return $scope.createOrderStatusHistory(createdOrder);
        })
        .then(function () {
          // Xóa giỏ hàng sau khi đặt hàng thành công
          $scope.cart = [];
          $scope.saveCartToLocalStorage();
          $scope.calculateTotals();
          $scope.showModal(
            "Đặt Hàng Thành Công",
            "Đơn hàng của bạn đã được đặt thành công."
          );
          // Chuyển hướng nếu cần
          setTimeout(() => {
            $window.location.href = "order.html";
          }, 3000);
        })
        .catch(function (error) {
          console.error("Lỗi trong quá trình xử lý đơn hàng:", error);
          $scope.showModal(
            "Lỗi",
            "Đã xảy ra lỗi trong quá trình xử lý đơn hàng. Vui lòng thử lại."
          );
        });
    };

    // Hàm cập nhật tồn kho sản phẩm
    $scope.updateProductStock = function () {
      const promises = $scope.cart.map((item) => {
        return $http
          .get(
            `http://localhost:8080/beesixcake/api/productdetail/${item.idproductdetail}`
          )
          .then(function (response) {
            const productDetail = response.data;
            productDetail.quantityinstock -= item.selectedQuantity;
            return $http.put(
              `http://localhost:8080/beesixcake/api/productdetail/${item.idproductdetail}`,
              productDetail
            );
          });
      });

      return $q.all(promises).then(function () {
        console.log("Cập nhật tồn kho thành công.");
      });
    };

    // Hàm tạo lịch sử trạng thái đơn hàng
    $scope.createOrderStatusHistory = function (createdOrder) {
      const statusHistory = {
        order: { idorder: createdOrder.idorder },
        status: { idstatus: 3 }, // 1: Đơn hàng mới
        timestamp: new Date().toISOString(),
      };

      return $http
        .post(
          "http://localhost:8080/beesixcake/api/order-status-history",
          statusHistory
        )
        .then(function () {
          console.log("Tạo lịch sử trạng thái đơn hàng thành công.");
        })
        .catch(function (error) {
          console.error("Lỗi khi tạo lịch sử trạng thái:", error);
        });
    };

    // Hàm xóa sản phẩm khỏi giỏ hàng
    $scope.deleteProduct = function (productId) {
      $scope.cart = $scope.cart.filter(
        (item) => item.idproductdetail !== productId
      );
      $scope.updateCart();
      $scope.calculateTotals();
      $scope.saveCartToLocalStorage();
    };

    // Hàm chuyển hướng về trang giỏ hàng
    $scope.returnToCart = function () {
      // Có thể chuyển hướng hoặc thực hiện hành động cần thiết
      $window.location.href = "giohang.html";
    };

    // Hàm chuyển đổi thời gian thành định dạng "MM:SS"
    $scope.formatTime = function (seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    };

    // Hàm hiển thị modal thông báo
    $scope.showModal = function (title, message) {
      $scope.modalTitle = title;
      $scope.modalMessage = message;
      const modal = new bootstrap.Modal(document.getElementById("infoModal"));
      modal.show();
    };

    // Hàm khởi tạo
    $scope.loadInitialData();

    // Xóa các bộ đếm khi controller bị hủy
    $scope.$on("$destroy", function () {
      if ($scope.paymentCheckTimer) {
        clearInterval($scope.paymentCheckTimer);
      }
      if ($scope.timer) {
        clearInterval($scope.timer);
      }
    });
  },
]);
