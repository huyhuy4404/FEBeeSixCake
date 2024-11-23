var app = angular.module("order", ["ngRoute"]);

// Controller cho giỏ hàng
app.controller("CartController", [
  "$scope",
  "$http",
  "$timeout",
  function ($scope, $http, $timeout) {
    $scope.products = []; // Dữ liệu giỏ hàng
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    let updateTimeout = null;

    // Kiểm tra người dùng đã đăng nhập chưa
    if (!loggedInUser) {
      console.log("Bạn cần đăng nhập.");
      return;
    }

    // Lấy idShoppingCart của người dùng
    $http
      .get(
        `http://localhost:8080/beesixcake/api/shoppingcart/account/${loggedInUser.idaccount}`
      )
      .then(function (response) {
        const idShoppingCart = response.data[0].idshoppingcart;
        console.log("idShoppingCart:", idShoppingCart);

        // Lấy các sản phẩm trong giỏ hàng
        $http
          .get(
            `http://localhost:8080/beesixcake/api/cartitems/shoppingcart/${idShoppingCart}`
          )
          .then(function (cartItemsResponse) {
            // Nhóm sản phẩm theo productdetail.idproductdetail
            const groupedProducts = {};

            cartItemsResponse.data.forEach(function (item) {
              const productDetailId = item.productdetail.idproductdetail;
              if (groupedProducts[productDetailId]) {
                groupedProducts[productDetailId].quantity += item.quantity;
                groupedProducts[productDetailId].cartItems.push(item);
              } else {
                groupedProducts[productDetailId] = {
                  id: item.productdetail.product.idproduct,
                  name: item.productdetail.product.productname,
                  price: item.productdetail.unitprice,
                  quantity: item.quantity,
                  image: item.productdetail.product.img,
                  idproductdetail: productDetailId,
                  size: item.productdetail.size,
                  selected: false,
                  idcartitem: item.idcartitem || "Chưa có idcartitem",
                  cartItems: [item],
                  stockQuantity: item.productdetail.quantityinstock,
                  idShoppingCart: idShoppingCart,
                };
              }
            });

            // Chuyển groupedProducts thành mảng để hiển thị
            $scope.products = Object.values(groupedProducts);
            $scope.products.forEach((product) => {
              product.cartItems.forEach((cartItem) => {
                const productDetail = cartItem.productdetail;
                console.log(
                  `idcartitem: ${cartItem.idcartitem}, Tên sản phẩm: ${cartItem.productdetail.product.productname}, Sản phẩm này có cùng idproductdetail: ${productDetail.idproductdetail}`
                );
                console.log(`Tồn kho: ${productDetail.quantityinstock}`);
              });
            });
            // Tính tổng giá trị đơn hàng
            $scope.calculateTotal();
          })
          .catch(function (error) {
            console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
          });
      })
      .catch(function (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
      });
    $scope.updateQuantityInDatabase = function (product) {
      if (updateTimeout) {
        $timeout.cancel(updateTimeout); // Hủy bỏ timeout nếu người dùng tiếp tục thay đổi
      }

      // Kiểm tra các thuộc tính cần thiết
      if (
        !product.idcartitem ||
        !product.quantity ||
        !product.idShoppingCart ||
        !product.idproductdetail
      ) {
        console.error(
          "Thiếu idcartitem, quantity, idShoppingCart, hoặc idproductdetail:",
          product
        );
        return;
      }

      // Tạo payload theo cấu trúc API yêu cầu, chỉ thay đổi quantity, các giá trị khác giữ nguyên
      const payload = {
        idcartitem: product.idcartitem,
        quantity: product.quantity, // Cập nhật quantity
        productdetail: {
          idproductdetail: product.idproductdetail,
          unitprice: product.price || 0, // Giữ nguyên hoặc đặt giá trị mặc định
          quantityinstock: product.stockQuantity || 0,
          product: {
            idproduct: product.id, // Giữ nguyên ID sản phẩm
            productname: product.name,
            img: product.image,
            description: product.description || "string", // Thêm mô tả nếu có
            isactive: true, // Giữ trạng thái mặc định
            category: {
              idcategory: product.categoryId || 0, // Giữ nguyên ID category nếu có
              categoryname: product.categoryName || "string",
            },
          },
          size: {
            idsize: product.size.idsize || 0,
            sizename: product.size.sizename || "string",
          },
        },
        shoppingcart: {
          idshoppingcart: product.idShoppingCart, // Thêm idShoppingCart
          account: {
            idaccount: product.accountId || "string",
            password: product.password || "string",
            fullname: product.fullname || "string",
            email: product.email || "string",
            phonenumber: product.phonenumber || "string",
            active: true,
            idrole: product.roleId || 0,
          },
        },
      };

      // Log payload để kiểm tra trước khi gửi
      console.log("Cập nhật số lượng với payload:", payload);

      // Đặt timeout để cập nhật sau khi người dùng dừng thay đổi trong 3 giây
      updateTimeout = $timeout(function () {
        $http
          .put(
            `http://localhost:8080/beesixcake/api/cartitems/${product.idcartitem}`,
            payload
          )
          .then(function (response) {
            console.log("Cập nhật số lượng thành công:", response.data);
          })
          .catch(function (error) {
            console.error("Lỗi khi cập nhật số lượng:", error); // Log chi tiết lỗi
            console.error("Thông tin lỗi:", error.data); // Thêm thông tin từ máy chủ nếu có
          });
      }, 3000); // Đợi 3 giây
    };

    $scope.increaseQuantity = function (product) {
      if (product.quantity < product.stockQuantity) {
        product.quantity += 1;
        product.outOfStock = false; // Đặt lại trạng thái hết hàng nếu số lượng hợp lệ
      } else {
        $("#exceedStockModal").modal("show");
      }
      $scope.calculateTotal();

      // Cập nhật số lượng hiển thị và gọi update sau 3 giây nếu không thay đổi
      console.log("Số lượng hiện tại của sản phẩm:", product.quantity);
      $scope.updateQuantityInDatabase(product);
    };
    // Kiểm tra và điều chỉnh số lượng sản phẩm nhập tay
    $scope.validateQuantity = function (product) {
      if (isNaN(product.quantity) || product.quantity < 1) {
        product.quantity = 1;
      } else if (product.quantity > product.stockQuantity) {
        product.quantity = product.stockQuantity;
        $("#exceedStockModal").modal("show");
      }

      product.outOfStock = product.quantity > product.stockQuantity;
      $scope.calculateTotal();

      // Cập nhật số lượng hiển thị và gọi update sau 3 giây nếu không thay đổi
      console.log("Số lượng hiện tại của sản phẩm:", product.quantity);
      $scope.updateQuantityInDatabase(product);
    };
    // Tính tổng giá trị giỏ hàng, đánh dấu hết hàng nếu số lượng vượt quá tồn kho
    $scope.calculateTotal = function () {
      $scope.totalPrice = $scope.products.reduce(function (sum, product) {
        if (product.quantity > product.stockQuantity) {
          product.outOfStock = true; // Đánh dấu sản phẩm là "Hết hàng"
        } else {
          product.outOfStock = false;
          return sum + product.price * product.quantity;
        }
        return sum;
      }, 0);
    };

    $scope.calculateSelectedTotal = function () {
      return $scope.products.reduce(function (sum, product) {
        if (product.selected) {
          if (product.quantity <= product.stockQuantity) {
            product.outOfStock = false;
            return sum + product.price * product.quantity;
          } else {
            product.outOfStock = true;
          }
        }
        return sum;
      }, 0);
    };
    $scope.decreaseQuantity = function (product) {
      if (product.quantity > 1) {
        product.quantity -= 1;
        product.outOfStock = product.quantity > product.stockQuantity;
        $scope.calculateTotal();
      }

      // Cập nhật số lượng hiển thị và gọi update sau 3 giây nếu không thay đổi
      console.log("Số lượng hiện tại của sản phẩm:", product.quantity);
      $scope.updateQuantityInDatabase(product);
    };
    // Biến để lưu sản phẩm cần xóa
    $scope.productToRemove = null;

    // Hiển thị modal và lưu sản phẩm cần xóa
    $scope.removeFromCart = function (product) {
      $scope.productToRemove = product;
      $("#confirmationModal").modal("show"); // Hiển thị modal xác nhận xóa
    };

    // Xác nhận xóa sản phẩm
    $scope.confirmRemove = function () {
      $http
        .delete(
          `http://localhost:8080/beesixcake/api/cartitems/productdetail/${$scope.productToRemove.idproductdetail}`
        )
        .then(function (response) {
          const index = $scope.products.indexOf($scope.productToRemove);
          if (index !== -1) {
            $scope.products.splice(index, 1);
            $scope.calculateTotal(); // Cập nhật tổng tiền
            showMessage("Đã xóa sản phẩm khỏi giỏ hàng.", "success");
          }
          $("#confirmationModal").modal("hide"); // Đóng modal sau khi xóa
        })
        .catch(function (error) {
          console.error("Lỗi khi xóa sản phẩm:", error);
          showMessage("Không thể xóa sản phẩm. Vui lòng thử lại.", "danger");
          $("#confirmationModal").modal("hide"); // Đóng modal khi có lỗi
        });
    };
    $scope.checkout = function () {
      const selectedProducts = $scope.products.filter(
        (product) => product.selected
      );

      if (selectedProducts.length === 0) {
        // Hiển thị thông báo khi không có sản phẩm nào được chọn
        $("#noProductSelectedModal").modal("show");
      } else {
        // Lưu danh sách sản phẩm đã chọn vào localStorage
        localStorage.setItem(
          "selectedProducts",
          JSON.stringify(selectedProducts)
        );

        // Chuyển hướng đến trang thanh toán
        window.location.href = "../assets/thanhtoan.html";
      }
    };
  },
]);

app.controller("loadLoaiSanPham", function ($scope, $http) {
  // Khởi tạo mảng để chứa loại sản phẩm
  $scope.category = [];
  $scope.selectedCategory = ""; // Danh mục được chọn

  // Lấy danh mục sản phẩm
  $scope.getCategories = function () {
    $http
      .get("http://localhost:8080/beesixcake/api/category")
      .then(function (response) {
        if (Array.isArray(response.data)) {
          // Lưu danh mục vào mảng
          $scope.category = response.data.map((item) => ({
            idcategory: item.idcategory,
            categoryname: item.categoryname,
          }));
        } else {
          console.error("Dữ liệu danh mục không phải là mảng!");
        }
      })
      .catch(function (error) {
        console.error("Lỗi khi lấy danh mục sản phẩm:", error);
      });
  };

  // Lọc sản phẩm theo loại (chỉ lưu tên danh mục vào localStorage để dùng sau)
  $scope.filterProducts = function (categoryName, shouldRedirect = true) {
    $scope.selectedCategory = categoryName;

    // Lưu loại sản phẩm vào localStorage
    localStorage.setItem("selectedCategory", categoryName);

    // Chuyển hướng nếu cần
    if (shouldRedirect) {
      window.location.href = "SanPham.html"; // Chuyển đến trang sản phẩm
    }
  };

  // Gọi hàm để tải danh mục sản phẩm ban đầu
  $scope.getCategories();
});

// Controller cho đăng nhập và đăng xuất
app.controller("CheckLogin", function ($scope, $http, $window, $timeout) {
  $scope.isLoggedIn = false;
  $scope.user = { idaccount: "", password: "" };
  $scope.loginError = "";

  // Kiểm tra người dùng đã đăng nhập chưa
  if (localStorage.getItem("loggedInUser")) {
    $scope.isLoggedIn = true;
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  } else {
    $window.location.href = "login.html"; // Chuyển đến trang đăng nhập nếu chưa đăng nhập
  }

  // Cập nhật giao diện theo trạng thái đăng nhập
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
  };

  // Đăng nhập
  $scope.login = function () {
    if (!$scope.isLoggedIn) {
      $scope.loginError = ""; // Reset thông báo lỗi

      // Gửi yêu cầu để lấy danh sách tài khoản
      $http
        .get("http://localhost:8080/beesixcake/api/account")
        .then(function (response) {
          $scope.accounts = response.data;
          const foundAccount = $scope.accounts.find(
            (account) =>
              account.idaccount === $scope.user.idaccount &&
              account.password === $scope.user.password
          );

          if (foundAccount) {
            if (foundAccount.admin) {
              $scope.loginError = "Bạn không có quyền truy cập!";
            } else {
              $scope.loginSuccess = "Đăng nhập thành công!";
              localStorage.setItem(
                "loggedInUser",
                JSON.stringify(foundAccount)
              );
              $scope.updateAccountMenu();
              $window.location.href = "index.html"; // Chuyển đến trang chính sau khi đăng nhập thành công
            }
          } else {
            $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
          }
        })
        .catch(function (error) {
          $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
          console.error("Error:", error);
        });
    } else {
      alert("Bạn đã đăng nhập rồi.");
    }
  };

  // Đăng xuất
  $scope.logout = function () {
    localStorage.removeItem("loggedInUser");
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
    $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
  };
});
