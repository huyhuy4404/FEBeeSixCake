var app = angular.module("myApp", []);

// Controller xử lý thanh toán
app.controller("CheckoutController", function ($scope, $window, $http) {
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
        alert("Bạn chưa có địa chỉ nào. Vui lòng thêm địa chỉ.");
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
    const order = {
      orderdate: new Date().toISOString(),
      addressdetail: $scope.address,
      shipfee: $scope.shippingFee,
      total: $scope.finalTotal,
      account: { idaccount: $scope.userId },
      discount: $scope.currentDiscount || { iddiscount: 0 },
      payment: { idpayment: $scope.selectedPaymentId },
      statuspay: { idstatuspay: 1 },
    };

    $http
      .post("http://localhost:8080/beesixcake/api/order", order)
      .then(function (response) {
        $scope.createOrderDetails(response.data);
      })
      .catch((error) => {
        console.error("Lỗi khi đặt hàng:", error);
      });
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
        alert("Đặt hàng thành công!");
        $window.location.href = "order.html"; // Chuyển hướng sau khi đặt hàng
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
