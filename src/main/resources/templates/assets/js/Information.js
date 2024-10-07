var app = angular.module('myApp', []);

app.controller('Controller', function($scope, $http) {
    // Hàm để lấy thông tin tài khoản đã đăng nhập từ localStorage
    $scope.getUserInfo = function() {
        var loggedInUser = localStorage.getItem('loggedInUser');
        if (loggedInUser) {
            // Parse lại thông tin người dùng đã đăng nhập từ localStorage
            $scope.user = JSON.parse(loggedInUser);
        } else {
            // Nếu không có thông tin đăng nhập trong localStorage
            $scope.user = null;
        }
    };


    // Hàm cập nhật thông tin người dùng
    $scope.updateUserProfile = function () {
        if (!$scope.user.phonenumber || !$scope.user.idaccount) {
            console.error('Dữ liệu không hợp lệ!');
            return;
        }
        // Gửi yêu cầu PUT kèm theo idaccount trong URL
        $http.put('http://localhost:8080/beesixcake/api/account/' + $scope.user.idaccount, $scope.user)
            .then(function (response) {
                console.log('Thông tin cập nhật thành công', response);
            })
            .catch(function (error) {
                console.error('Lỗi khi cập nhật thông tin: ', error);
            });
    };
    
    

    // Gọi hàm để lấy thông tin người dùng khi trang tải
    $scope.getUserInfo();
});
