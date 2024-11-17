var app = angular.module("myApp", []);

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
  if (!selectedProducts || selectedProducts.length === 0) {
    alert("Không có sản phẩm nào được chọn. Vui lòng quay lại giỏ hàng.");
    $window.location.href = "../assets/index.html";
    return;
  } else {
    $scope.products = selectedProducts;
  }

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
        // Sắp xếp địa chỉ mặc định lên đầu
        $scope.addresses.sort(
          (a, b) => (b.isDefault === true) - (a.isDefault === true)
        );
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
  $scope.totalPrice = selectedProducts.reduce(
    (sum, product) => sum + product.price * product.quantity,
    0
  );
  $scope.shippingFee = 20000; // Ví dụ: phí vận chuyển cố định
  $scope.voucherDiscount = 0; // Không áp dụng giảm giá mặc định
  $scope.finalTotal =
    $scope.totalPrice + $scope.shippingFee - $scope.voucherDiscount;

  // Hàm xóa sản phẩm khỏi giỏ hàng
  $scope.deleteProduct = function (idcartitem) {
    const index = $scope.products.findIndex((p) => p.idcartitem === idcartitem);
    if (index !== -1) {
      $scope.products.splice(index, 1);
      localStorage.setItem("selectedProducts", JSON.stringify($scope.products));

      $scope.totalPrice = $scope.products.reduce(
        (sum, product) => sum + product.price * product.quantity,
        0
      );
      $scope.voucherDiscount =
        $scope.totalPrice >= 200000 ? $scope.totalPrice * 0.05 : 0;
      $scope.finalTotal =
        $scope.totalPrice + $scope.shippingFee - $scope.voucherDiscount;

      $scope.checkEmptyCart(); // Gọi phương thức kiểm tra giỏ hàng trống
    }
  };

  $scope.checkEmptyCart = function () {
    if ($scope.products.length === 0) {
      $window.location.href = "giohang.html";
    }
  };

  // Lấy phương thức thanh toán
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

  // Mở modal thay đổi phương thức thanh toán
  $scope.openPaymentModal = function () {
    $scope.selectedPaymentId = $scope.selectedPayment.idpayment;
    var paymentModal = new bootstrap.Modal(
      document.getElementById("paymentModal")
    );
    paymentModal.show();
  };

  // Cập nhật phương thức thanh toán khi người dùng chọn
  $scope.updatePaymentMethod = function (payment) {
    $scope.selectedPayment = payment;
    $scope.selectedPaymentId = payment.idpayment;
  };

  // Xử lý mã giảm giá
  $scope.selectedDiscount = null;
  $scope.openDiscountModal = function () {
    $http
      .get("http://localhost:8080/beesixcake/api/discount")
      .then(function (response) {
        const currentDate = new Date();
        $scope.validDiscounts = response.data.filter((discount) => {
          const startDate = new Date(discount.startdate);
          const endDate = new Date(discount.enddate);
          return (
            $scope.totalPrice >= discount.lowestprice &&
            currentDate >= startDate &&
            currentDate <= endDate
          );
        });
        const discountModal = new bootstrap.Modal(
          document.getElementById("discountModal")
        );
        discountModal.show();
      })
      .catch(function (error) {
        console.error("Lỗi khi lấy danh sách mã giảm giá:", error);
      });
  };

  $scope.selectDiscount = function (discount) {
    $scope.selectedDiscount = discount;
    $scope.voucherDiscount = discount
      ? ($scope.totalPrice * discount.discountpercentage) / 100
      : 0;
    $scope.finalTotal =
      $scope.totalPrice + $scope.shippingFee - $scope.voucherDiscount;
  };
  $scope.bankInfo = {
    name: "Ngân hàng Vietcombank",
    accountNumber: "0123456789",
    accountHolder: "BEESIXCAKE",
  };

  $scope.generateQRCode = function () {
    if (
      $scope.selectedPayment.paymentname ===
      "Thanh Toán Qua Chuyển Khoản Ngân Hàng"
    ) {
      const qrData =
        `Ngân hàng: ${$scope.bankInfo.name}\n` +
        `Số tài khoản: ${$scope.bankInfo.accountNumber}\n` +
        `Chủ tài khoản: ${$scope.bankInfo.accountHolder}\n` +
        `Nội dung chuyển khoản: THANH TOÁN HÓA ĐƠN BEESIXCAKE\n` +
        `Tổng tiền: ${$scope.finalTotal} VNĐ`;

      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        qrData
      )}&size=300x300`;

      $scope.qrCode = qrApiUrl;
    }
  };
});

// Controller kiểm tra đăng nhập
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
