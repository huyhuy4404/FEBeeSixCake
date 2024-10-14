var app = angular.module("myApp", []);

app.controller("CheckoutController", function ($scope, $window) {
  // Kiểm tra xem người dùng đã đăng nhập chưa
  if (localStorage.getItem("loggedInUser")) {
    // Lấy thông tin tài khoản từ localStorage
    var loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    // Đổ thông tin người dùng vào giao diện
    $scope.fullname = loggedInUser.fullname; // Họ tên người dùng
    $scope.phone = loggedInUser.phonenumber; // Số điện thoại
  } else {
    // Nếu chưa đăng nhập, chuyển hướng sang trang đăng nhập
    $window.location.href = "login.html";
  }
});
