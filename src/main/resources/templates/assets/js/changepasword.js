var app = angular.module('myAccountChangePassword', []);

app.controller('ChangePasswordController', function($scope, $http, $window) {
    // Lấy thông tin người dùng từ localStorage
    $scope.user = JSON.parse(localStorage.getItem('loggedInUser')) || {};

    // Phương thức đổi mật khẩu
    $scope.changePassword = function() {
        // Kiểm tra khớp mật khẩu mới và xác nhận mật khẩu
        if ($scope.user.newPassword !== $scope.user.confirmPassword) {
            alert('Xác nhận mật khẩu không khớp với mật khẩu mới!');
            return;
        }

        // Kiểm tra tính hợp lệ của form
        if ($scope.changePasswordForm.$valid) {
            var payload = {
                idaccount: $scope.user.idaccount, // Lấy idaccount từ thông tin người dùng
                password: $scope.user.password, // Mật khẩu hiện tại
                newPassword: $scope.user.newPassword, // Mật khẩu mới
                email: $scope.user.email,
                fullname: $scope.user.fullname,
                phonenumber: $scope.user.phonenumber
            };

            $http({
                method: 'PUT',
                url: 'http://localhost:8080/beesixcake/api/account/'+ $scope.user.idaccount, // Endpoint để cập nhật mật khẩu
                data: payload
            }).then(function(response) {
                // Xử lý khi đổi mật khẩu thành công
                alert('Đổi mật khẩu thành công!');
                $scope.user.password = $scope.user.newPassword; // Lưu lại mật khẩu mới
                localStorage.setItem('loggedInUser', JSON.stringify($scope.user));
                $window.location.href = 'DangNhap.html'; // Chuyển đến trang đăng nhập
            }).catch(function(error) {
                // Xử lý khi đổi mật khẩu thất bại
                console.error('Lỗi:', error);
                if (error.data && error.data.message) {
                    alert('Đổi mật khẩu thất bại! ' + error.data.message);
                } else {
                    alert('Đổi mật khẩu thất bại! Vui lòng thử lại.');
                }
            });
            
        } else {
            alert('Vui lòng kiểm tra lại thông tin.');
        }
    };
});
