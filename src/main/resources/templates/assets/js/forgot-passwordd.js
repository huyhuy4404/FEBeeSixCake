var app = angular.module('myApp', []);

app.controller('ResetPasswordController', function($scope, $http, $window) {
    $scope.user = {
        email: ''
    };
    $scope.resetSuccess = '';
    $scope.resetError = '';
    $scope.isSubmitting = false; // Biến theo dõi trạng thái gửi

    $scope.sendResetLink = function() {
        // Kiểm tra nếu đang gửi để tránh gửi nhiều lần
        if ($scope.isSubmitting) {
            return;
        }

        // Kiểm tra tính hợp lệ của form
        if (!$scope.user.email) {
            alert('Vui lòng nhập email!');
            return;
        }

        $scope.isSubmitting = true; // Đánh dấu là đang gửi

        // Gửi yêu cầu đến server để gửi liên kết đặt lại mật khẩu
        $http.post('http://localhost:8080/beesixcake/api/account', { email: $scope.user.email })
        .then(function(response) {
            $scope.resetSuccess = "Liên kết đặt lại mật khẩu đã được gửi đến email của bạn.";
            $scope.resetError = null; // Xóa thông báo lỗi nếu có
        })
        .catch(function(error) {
            $scope.resetError = "Có lỗi xảy ra, vui lòng thử lại.";
            $scope.resetSuccess = null; // Xóa thông báo thành công nếu có
        })
        .finally(function() {
            $scope.isSubmitting = false; // Đánh dấu không còn đang gửi
        });
    };
});