var app = angular.module("myApp", []);

// Controller xử lý thanh toán
app.controller("CheckoutController", function ($scope, $window, $http) {
  $scope.qrCode = null; // Đường dẫn ảnh mã QR
  $scope.paymentStatus = "PENDING"; // Trạng thái thanh toán
  $scope.countdown = 0;
  // Kiểm tra đăng nhập và lấy thông tin người dùng
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

  // Lấy sản phẩm từ localStorage
  const selectedProducts = JSON.parse(localStorage.getItem("selectedProducts"));
  // Lấy sản phẩm từ localStorage
  $scope.products = JSON.parse(localStorage.getItem("selectedProducts")) || [];

  // Không cần thông báo hoặc chuyển trang, chỉ cần kiểm tra và hiển thị dữ liệu nếu có
  $scope.hasProducts = $scope.products.length > 0;

  // Hàm định dạng địa chỉ
  $scope.formatAddress = function (address) {
    let parts = [];
    if (address.housenumber) parts.push(address.housenumber);
    if (address.roadname) parts.push(address.roadname);
    if (address.ward) parts.push(address.ward);
    if (address.district) parts.push(address.district);
    if (address.city) parts.push(address.city);
    return parts.join(", ");
  };

  // Lấy danh sách địa chỉ từ API
  $http
    .get(
      `http://localhost:8080/beesixcake/api/address/account/${$scope.userId}`
    )
    .then(function (response) {
      $scope.addresses = response.data;
      if ($scope.addresses.length === 0) {
        // Gọi modal thay vì alert
        const addressModal = new bootstrap.Modal(
          document.getElementById("addressModal")
        );
        addressModal.show();
      } else {
        $scope.defaultAddress =
          $scope.addresses.find((addr) => addr.isDefault) ||
          $scope.addresses[0];
        $scope.selectedAddressId = $scope.defaultAddress.idaddress;
        $scope.address = $scope.formatAddress($scope.defaultAddress);
      }
    })
    .catch(function (error) {
      console.error("Lỗi khi lấy địa chỉ từ API:", error);
    });

  // Hàm chuyển hướng đến trang thêm địa chỉ
  $scope.redirectToAddAddress = function () {
    window.location.href = "addrest.html";
  };

  // Tính tổng giá tiền
  $scope.calculateTotals = function () {
    $scope.totalPrice = $scope.products.reduce(
      (sum, product) => sum + (product.price || 0) * (product.quantity || 0),
      0
    );

    $scope.shippingFee = $scope.totalPrice > 0 ? 20000 : 0; // Phí vận chuyển
    $scope.voucherDiscount = 0; // Reset giảm giá

    // Kiểm tra lại mã giảm giá nếu có
    if ($scope.currentDiscount) {
      if ($scope.totalPrice < $scope.currentDiscount.lowestprice) {
        // Hủy mã giảm giá nếu không đạt điều kiện
        $scope.cancelDiscountCode();
        $scope.discountError =
          "Đơn hàng không còn đủ điều kiện để áp dụng mã giảm giá.";
      } else {
        $scope.voucherDiscount =
          ($scope.totalPrice * $scope.currentDiscount.discountpercentage) / 100;
      }
    }

    // Tính tổng tiền cuối cùng
    $scope.finalTotal =
      $scope.totalPrice + $scope.shippingFee - $scope.voucherDiscount;
  };

  $scope.calculateTotals();
  // Lấy phương thức thanh toán từ API
  $http
    .get("http://localhost:8080/beesixcake/api/payment")
    .then(function (response) {
      $scope.payments = response.data;
      $scope.selectedPayment = $scope.payments[0];
      $scope.selectedPaymentId = $scope.selectedPayment.idpayment;
    })
    .catch(function (error) {
      console.error("Lỗi khi lấy phương thức thanh toán:", error);
    });

  $scope.openPaymentModal = function () {
    const paymentModal = new bootstrap.Modal(
      document.getElementById("paymentModal")
    );
    paymentModal.show();
  };

  $scope.updatePaymentMethod = function (payment) {
    $scope.selectedPayment = payment;
    $scope.selectedPaymentId = payment.idpayment;
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
            ($scope.totalPrice * discount.discountpercentage) / 100; // Chỉ tính giảm trên tiền hàng
          $scope.finalTotal =
            $scope.totalPrice + $scope.shippingFee - $scope.voucherDiscount;
          $scope.discountSuccess = `Áp dụng mã giảm giá ${code} thành công!`;
        }
      })
      .catch(() => {
        $scope.discountError = "Mã giảm giá không tồn tại.";
      });
  };

  $scope.cancelDiscountCode = function () {
    // Xóa các thông báo cũ trước khi cập nhật
    $scope.discountError = "";
    $scope.discountSuccess = "";

    $scope.currentDiscount = null;
    $scope.voucherDiscount = 0;
    $scope.finalTotal = $scope.totalPrice + $scope.shippingFee;
    $scope.discountSuccess = "Mã giảm giá đã được hủy.";
  };

  // Đặt hàng
  $scope.placeOrder = function () {
    // Bước 1: Kiểm tra nếu giỏ hàng không có sản phẩm
    if ($scope.products.length === 0) {
      $scope.showModal(
        "Lỗi",
        "Không thể đặt hàng vì không có sản phẩm trong giỏ."
      );
      return;
    }

    // Bước 2: Kiểm tra số lượng tồn kho cho từng productdetail
    let isStockAvailable = true; // Biến kiểm tra tình trạng tồn kho
    let errorOccurred = false; // Cờ kiểm tra lỗi

    // Lặp qua tất cả sản phẩm trong giỏ hàng
    for (let i = 0; i < $scope.products.length; i++) {
      const product = $scope.products[i];

      // Lấy idproductdetail từ sản phẩm
      const productDetailId = product.idproductdetail;

      // Gửi yêu cầu API để lấy chi tiết sản phẩm và kiểm tra tồn kho
      $http
        .get(
          `http://localhost:8080/beesixcake/api/productdetail/${productDetailId}`
        )
        .then(function (response) {
          const productDetail = response.data; // Lấy chi tiết sản phẩm
          const stockQuantity = productDetail.quantityinstock; // Số lượng tồn kho
          const cartQuantity = product.quantity; // Số lượng trong giỏ hàng

          // Kiểm tra xem số lượng sản phẩm trong giỏ có vượt quá số lượng tồn kho không
          if (cartQuantity > stockQuantity) {
            // Nếu chưa có lỗi xảy ra, hiển thị thông báo lỗi và dừng
            if (!errorOccurred) {
              $scope.showModal(
                "Lỗi",
                "Sản phẩm có thể đã không còn đủ số lượng! Nếu bạn đã thanh toán, Admin sẽ liên hệ và hoàn tiền trong 24h."
              );
              errorOccurred = true; // Đánh dấu là đã có lỗi xảy ra
            }
            isStockAvailable = false; // Đánh dấu là không đủ tồn kho
            return; // Dừng lại ngay lập tức nếu phát hiện không đủ hàng
          }

          // Bước 3: Nếu tất cả sản phẩm có đủ số lượng, tiếp tục thực hiện đơn hàng
          if (i === $scope.products.length - 1 && isStockAvailable) {
            const isPaid = $scope.paymentStatus === "PAID"; // Kiểm tra trạng thái thanh toán
            const order = {
              orderdate: new Date().toISOString(),
              addressdetail: $scope.address,
              shipfee: $scope.shippingFee,
              total: $scope.finalTotal,
              account: { idaccount: $scope.userId },
              discount: $scope.currentDiscount || { iddiscount: 0 },
              payment: { idpayment: $scope.selectedPaymentId },
              statuspay: { idstatuspay: isPaid ? 2 : 1 }, // Nếu đã thanh toán, idstatuspay = 2
            };

            // Gửi yêu cầu tạo đơn hàng
            $http
              .post("http://localhost:8080/beesixcake/api/order", order)
              .then(function (response) {
                // Kiểm tra dữ liệu trả về
                console.log("Đơn hàng được tạo:", response.data);

                // Sau khi tạo đơn hàng, xử lý chi tiết đơn hàng
                $scope.createOrderDetails(response.data);

                // Hiển thị thông báo trạng thái
                const message = isPaid
                  ? "Đơn hàng đã được thanh toán thành công và đặt hàng thành công!"
                  : "Đơn hàng chưa được thanh toán. Đặt hàng thành công với trạng thái 'Chưa thanh toán'.";
                $scope.showModal("Đặt Hàng Thành Công", message);

                // Chuyển hướng tới trang đặt hàng nếu cần
                setTimeout(() => {
                  console.log("Chuyển hướng sau 5 giây.");
                  $window.location.href = "order.html";
                }, 5000);
              })
              .catch((error) => {
                console.error("Lỗi khi đặt hàng:", error);
                $scope.showModal(
                  "Lỗi",
                  "Không thể đặt hàng. Vui lòng thử lại."
                );
              });
          }
        })
        .catch(function (error) {
          console.error("Lỗi khi lấy thông tin sản phẩm:", error);
          $scope.showModal(
            "Lỗi",
            "Có lỗi xảy ra khi kiểm tra số lượng sản phẩm."
          );
        });
    }
  };

  // Tạo OrderDetail
  $scope.createOrderDetails = function (createdOrder) {
    const promises = $scope.products.map((product) => {
      const orderDetail = {
        quantity: product.quantity,
        order: { idorder: createdOrder.idorder },
        productdetail: { idproductdetail: product.idproductdetail },
      };

      return $http.post(
        "http://localhost:8080/beesixcake/api/orderdetail",
        orderDetail
      );
    });

    Promise.all(promises)
      .then(() => {
        $scope.updateProductStock(createdOrder);
      })
      .catch((error) => {
        console.error("Lỗi khi tạo chi tiết đơn hàng:", error);
      });
  };

  // Cập nhật tồn kho sản phẩm
  $scope.updateProductStock = function (createdOrder) {
    $http
      .get(
        `http://localhost:8080/beesixcake/api/orderdetail/order/${createdOrder.idorder}`
      )
      .then((response) => {
        const productQuantities = {};
        response.data.forEach((detail) => {
          const productId = detail.productdetail.idproductdetail;
          if (!productQuantities[productId]) {
            productQuantities[productId] = 0;
          }
          productQuantities[productId] += detail.quantity;
        });

        const updatePromises = Object.keys(productQuantities).map(
          (productId) => {
            return $http
              .get(
                `http://localhost:8080/beesixcake/api/productdetail/${productId}`
              )
              .then((response) => {
                const productDetail = response.data;
                productDetail.quantityinstock -= productQuantities[productId];
                return $http.put(
                  `http://localhost:8080/beesixcake/api/productdetail/${productId}`,
                  productDetail
                );
              });
          }
        );

        return Promise.all(updatePromises);
      })
      .then(() => {
        $scope.createOrderStatusHistory(createdOrder);
      })
      .catch((error) => {
        console.error("Lỗi khi cập nhật tồn kho:", error);
      });
  };

  // Tạo lịch sử trạng thái đơn hàng
  $scope.createOrderStatusHistory = function (createdOrder) {
    const statusHistory = {
      order: { idorder: createdOrder.idorder },
      status: { idstatus: 1 },
      timestamp: new Date().toISOString(),
    };

    $http
      .post(
        "http://localhost:8080/beesixcake/api/order-status-history",
        statusHistory
      )
      .then(() => {
        console.log("Lịch sử trạng thái đơn hàng đã được tạo.");
        // Gọi hàm xóa các cartitems sau khi hoàn thành các bước trước đó
        $scope.deleteCartItems();
      })
      .then(() => {
        setTimeout(() => {
          console.log("Chuyển hướng sau 5 giây.");
          $window.location.href = "order.html";
        }, 5000); // Chuyển hướng sau khi đặt hàng
      })
      .catch((error) => {
        console.error("Lỗi khi tạo lịch sử trạng thái:", error);
      });
  };
  $scope.deleteCartItems = function () {
    const promises = $scope.products.map((product) => {
      return $http
        .delete(
          `http://localhost:8080/beesixcake/api/cartitems/${product.idcartitem}`
        )
        .then(() => {
          console.log(`Đã xóa cartitem với id: ${product.idcartitem}`);
        })
        .catch((error) => {
          console.error(
            `Lỗi khi xóa cartitem với id: ${product.idcartitem}`,
            error
          );
        });
    });

    Promise.all(promises)
      .then(() => {
        console.log("Đã xóa toàn bộ cartitems của đơn hàng thành công.");
      })
      .catch((error) => {
        console.error("Lỗi khi xóa các cartitems:", error);
      });
  };
  $scope.deleteProduct = function (productId) {
    // Lọc sản phẩm cần xóa
    $scope.products = $scope.products.filter(
      (product) => product.idcartitem !== productId
    );

    // Cập nhật lại tổng tiền
    $scope.calculateTotals();

    // Kiểm tra lại mã giảm giá hiện tại
    if ($scope.currentDiscount) {
      if ($scope.totalPrice < $scope.currentDiscount.lowestprice) {
        // Nếu không đạt điều kiện tối thiểu, hủy mã giảm giá
        $scope.cancelDiscountCode();
        $scope.discountError =
          "Đơn hàng không đủ điều kiện sử dụng mã giảm giá sau khi xóa sản phẩm.";
      } else {
        // Cập nhật lại giảm giá và tổng tiền nếu vẫn hợp lệ
        $scope.voucherDiscount =
          ($scope.totalPrice * $scope.currentDiscount.discountpercentage) / 100;
        $scope.finalTotal =
          $scope.totalPrice + $scope.shippingFee - $scope.voucherDiscount;
      }
    }

    // Cập nhật lại localStorage
    localStorage.setItem("selectedProducts", JSON.stringify($scope.products));
  };

  $scope.returnToCart = function () {
    // Xóa dữ liệu sản phẩm trong localStorage
    localStorage.removeItem("selectedProducts");
    // Chuyển hướng về trang giỏ hàng
    $window.location.href = "giohang.html";
  };
  // Thêm hàm tạo mã QR
  $scope.generateQRCode = function () {
    const randomChars = Array(3)
      .fill(null)
      .map(() => String.fromCharCode(65 + Math.floor(Math.random() * 26))) // Random 3 ký tự chữ (A-Z)
      .join("");

    const qrRequest = {
      productName: "HÓA ĐƠN BEESIXCAKE",
      description: "", // Nội dung chuyển khoản sẽ cập nhật sau khi gọi API
      returnUrl: "order.html",
      cancelUrl: "index.html",
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
            console.warn("Lỗi khi kiểm tra thanh toán:", response.data.message);
          }
        })
        .catch(function (error) {
          console.error("Lỗi khi kiểm tra trạng thái thanh toán:", error);
        });
    }, 5000); // Kiểm tra mỗi 5 giây
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

  // Đếm ngược 15 phút
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

  // Dừng đếm ngược
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

  // Hiển thị modal thông báo
  $scope.showModal = function (title, message) {
    $scope.modalTitle = title;
    $scope.modalMessage = message;
    const modal = new bootstrap.Modal(document.getElementById("infoModal"));
    modal.show();
  };
});

// Controller kiểm tra đăng nhập
app.controller("CheckLogin", function ($scope, $http, $window) {
  $scope.isLoggedIn = false;

  // Kiểm tra người dùng đã đăng nhập chưa
  if (localStorage.getItem("loggedInUser")) {
    $scope.isLoggedIn = true;
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  } else {
    $window.location.href = "login.html"; // Chuyển đến trang đăng nhập nếu chưa đăng nhập
  }

  // Đăng xuất
  $scope.logout = function () {
    localStorage.removeItem("loggedInUser");
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
    $window.location.href = "login.html";
  };
});
