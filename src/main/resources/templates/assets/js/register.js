var app = angular.module('myApp', ["ngRoute"]);

app.controller("RegisterController", function($scope, $http, $window) {
    // Initialize the user object
    $scope.user = {
        idaccount: '',    // Tên người dùng
        password: '',     // Mật khẩu
        fullname: '',     // Họ và tên
        email: '',        // Email
        phonenumber: '',  // Số điện thoại
        active: true,     // Trạng thái hoạt động
        idrole: 2         // Vai trò (admin/user)
    };

    // Variables to store messages
    $scope.registerSuccess = '';
    $scope.registerError = '';

    // Phương thức đăng ký
    $scope.register = function() {
        // Reset messages
        $scope.registerSuccess = '';
        $scope.registerError = '';

        // Kiểm tra tính hợp lệ của form
        if ($scope.regisForm.$valid) {
            // Gửi yêu cầu POST để đăng ký tài khoản mới
            $http({
                method: "POST",
                url: "http://localhost:8080/beesixcake/api/account", // API endpoint for registration
                data: $scope.user // Dữ liệu người dùng cần đăng ký
            }).then(function(response) {
                // Xử lý khi đăng ký thành công
                if (response.data.success) { // Adjust this if your response structure differs
                    $scope.registerSuccess = 'Đăng ký thành công! Vui lòng đăng nhập.';
                    $window.location.href = 'login.html'; // Chuyển đến trang đăng nhập sau khi đăng ký thành công
                } else {
                    // Handle API error message if present
                    $scope.registerError = response.data.message || 'Đăng ký thất bại! Vui lòng thử lại.';
                }
            }).catch(function(error) {
                // Xử lý khi đăng ký thất bại
                $scope.registerError = error.data?.message || 'Đăng ký thất bại! Lỗi từ máy chủ.';
                console.error('Error details:', error);
                

            });
        } else {
            $scope.registerError = 'Vui lòng kiểm tra lại thông tin.';
        }
        console.log($scope.user); // In ra dữ liệu user
    };
});
