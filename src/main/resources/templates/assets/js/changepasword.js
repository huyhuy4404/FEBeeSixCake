var app = angular.module('myAccountChangePassword', []);
app.controller('ChangePasswordController', function($scope, $http, $window) {
    if (!localStorage.getItem("loggedInUser")) {
        $window.location.href = "login.html";
        return;
    }

    $scope.user = JSON.parse(localStorage.getItem('loggedInUser')) || {};
    $scope.user.newPassword = '';
    $scope.user.confirmPassword = '';
    $scope.isSubmitting = false; // Biến theo dõi trạng thái gửi

    $scope.changePassword = function() {
        // Kiểm tra nếu đang gửi để tránh gửi nhiều lần
        if ($scope.isSubmitting) {
            return;
        }

        // Kiểm tra khớp mật khẩu mới và xác nhận mật khẩu
        if ($scope.user.newPassword !== $scope.user.confirmPassword) {
            alert('Xác nhận mật khẩu không khớp với mật khẩu mới!');
            return;
        }

        // Kiểm tra tính hợp lệ của form
        if ($scope.changePasswordForm.$valid) {
            $scope.isSubmitting = true; // Đánh dấu là đang gửi

            // Tạo payload chứa thông tin đổi mật khẩu
            var payload = {
                idaccount: $scope.user.idaccount,
                password: $scope.user.password,
                newPassword: $scope.user.newPassword,
                email: $scope.user.email,
                fullname: $scope.user.fullname,
                phonenumber: $scope.user.phonenumber
            };

            // Gửi yêu cầu PUT để đổi mật khẩu
            $http({
                method: 'PUT',
                url: 'http://localhost:8080/beesixcake/api/account/' + $scope.user.idaccount,
                data: payload
            }).then(function(response) {
                $scope.user.password = $scope.user.newPassword; // Cập nhật mật khẩu mới
                localStorage.setItem('loggedInUser', JSON.stringify($scope.user));
                alert('Đổi mật khẩu thành công!');
                $window.location.href = 'login.html'; 
            }).catch(function(error) {
                console.error('Lỗi:', error);
                alert('Đổi mật khẩu thất bại! Vui lòng thử lại.');
            }).finally(function() {
                $scope.isSubmitting = false; // Đánh dấu không còn đang gửi
            });
        } else {
            alert('Vui lòng kiểm tra lại thông tin.');
        }
    };
}); 
app.controller("CheckLogin", function ($scope, $http, $window) {
    // Khởi tạo thông tin người dùng và trạng thái đăng nhập
    $scope.isLoggedIn = false;

    // Kiểm tra trạng thái đăng nhập từ localStorage
    if (localStorage.getItem("loggedInUser")) {
        $scope.isLoggedIn = true;
        $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    } else {
        // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
        if ($window.location.pathname !== "/login.html") {
            $window.location.href = "login.html"; // Chuyển hướng đến trang đăng nhập
        }
    }

    // Hàm cập nhật giao diện
    $scope.updateAccountMenu = function () {
        $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    };

    // Phương thức đăng xuất
    $scope.logout = function () {
        localStorage.removeItem("loggedInUser");
        $scope.isLoggedIn = false;
        $scope.loggedInUser = null;
        $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
    };
});