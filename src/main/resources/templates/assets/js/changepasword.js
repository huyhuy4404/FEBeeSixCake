var app = angular.module('myAccountChangePassword', []);

app.controller('ChangePasswordController', function($scope, $http, $window) {
    // Kiểm tra người dùng đã đăng nhập chưa
    if (!localStorage.getItem("loggedInUser")) {
        $window.location.href = "login.html";
        return;
    }

    // Lấy thông tin người dùng từ localStorage
    $scope.user = JSON.parse(localStorage.getItem('loggedInUser')) || {};
    $scope.user.newPassword = '';
    $scope.user.confirmPassword = '';
    $scope.isSubmitting = false; // Trạng thái gửi

    // Hàm thay đổi mật khẩu
    $scope.changePassword = function() {
        if ($scope.isSubmitting) return;

        // Kiểm tra khớp mật khẩu mới và xác nhận mật khẩu
        if ($scope.user.newPassword !== $scope.user.confirmPassword) {
            alert('Xác nhận mật khẩu không khớp với mật khẩu mới!');
            return;
        }

        $scope.isSubmitting = true; // Đánh dấu đang gửi

        // Tạo payload chứa thông tin đổi mật khẩu
        var payload = {
            idaccount: $scope.user.idaccount,
            password: $scope.user.password,  // Mật khẩu hiện tại
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
   
            if (response.data && response.data.message === 0) {
                $scope.user.password = $scope.user.newPassword;
                localStorage.setItem('loggedInUser', JSON.stringify($scope.user));
                alert('Đổi mật khẩu thành công!');
                $window.location.href = 'login.html';
            } else {
                alert('Đổi mật khẩu thất bại! Vui lòng thử lại.');
            }
        }).catch(function(error) {
            console.error('Lỗi:', error);
            alert('Đổi mật khẩu thất bại! Vui lòng thử lại.');
        }).finally(function() {
            $scope.isSubmitting = false;
        });
    };
});

app.controller("CheckLogin", function($scope, $http, $window) {
    // Kiểm tra trạng thái đăng nhập từ localStorage
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser") || '{}');

    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    if (!$scope.isLoggedIn && $window.location.pathname !== "/login.html") {
        $window.location.href = "login.html";
    }

    // Phương thức đăng xuất
    $scope.logout = function() {
        localStorage.removeItem("loggedInUser");
        $scope.isLoggedIn = false;
        $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
    };
});
