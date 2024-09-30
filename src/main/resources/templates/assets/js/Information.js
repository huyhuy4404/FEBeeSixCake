var app = angular.module('myApp', []);

app.controller('Controller', function($scope, $http) {
    // Hàm để lấy thông tin tài khoản
    $scope.getUserInfo = function() {
        $http.get('http://localhost:8080/beesixcake/api/account')
            .then(function(response) {
                // Xử lý kết quả API trả về, lấy thông tin người dùng đầu tiên
                if (response.data && response.data.length > 0) {
                    $scope.user = response.data[0];  // Giả sử người dùng đã đăng nhập
                } else {
                    $scope.user = null;
                }
            }, function(error) {
                console.error('Lỗi khi lấy thông tin người dùng:', error);
            });
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
