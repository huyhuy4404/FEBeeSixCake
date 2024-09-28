var app = angular.module('myApp', ["ngRoute"]);

app.controller("RegisterController", function($scope, $http, $window) {
    // Initialize the user object
    $scope.user = {
        idaccount: '',    
        password: '',     
        fullname: '',     
        email: '',        
        phonenumber: '',  
        active: true,     
        idrole: 2         
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
                url: "http://localhost:8080/beesixcake/api/account",
                data: $scope.user
            }).then(function(response) {
                // Check if the response indicates success
                if (response.status === 200 || response.status === 201) { // Adjusted to check for standard HTTP success status codes
                    $scope.registerSuccess = 'Đăng ký thành công! Vui lòng đăng nhập.';
                    $window.location.href = 'login.html';
                } else {
                    // Handle unexpected responses
                    $scope.registerError = response.data.message || 'Đăng ký thất bại! Vui lòng thử lại.';
                }
            }).catch(function(error) {
                // Handle registration failure
                $scope.registerError = error.data?.message || 'Đăng ký thất bại! Lỗi từ máy chủ.';
                console.error('Error details:', error);
            });
        } else {
            $scope.registerError = 'Vui lòng kiểm tra lại thông tin.';
        }
    };
});
