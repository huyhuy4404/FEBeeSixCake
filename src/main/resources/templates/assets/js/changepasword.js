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
            fullname: $scope.user.fullname,
            email: $scope.user.email,
            phonenumber: $scope.user.phonenumber
        };
    
        console.log('Đang gửi yêu cầu đổi mật khẩu với payload:', payload); // Ghi log payload
    
        // Gửi yêu cầu PUT để đổi mật khẩu
        $http({
            method: 'PUT',
            url: 'http://localhost:8080/beesixcake/api/account/' + $scope.user.idaccount,
            data: payload
        }).then(function(response) {
            console.log('Phản hồi từ máy chủ:', response); // Ghi log phản hồi từ máy chủ
    
            if (response.data) {
                console.log('Nội dung dữ liệu phản hồi:', response.data); // Ghi log nội dung dữ liệu
    
                // Xử lý phản hồi thành công
                alert('Đổi mật khẩu thành công!');
                $scope.user.password = $scope.user.newPassword;
                localStorage.setItem('loggedInUser', JSON.stringify($scope.user));
                $window.location.href = 'login.html';
            } else {
                console.log('Phản hồi không hợp lệ:', response.data);
                alert('Đổi mật khẩu thất bại! Phản hồi từ máy chủ không hợp lệ.');
            }
        }).catch(function(error) {
            console.error('Lỗi xảy ra trong quá trình đổi mật khẩu:', error); // Ghi log lỗi chi tiết
            
            // Kiểm tra nếu có thông báo lỗi từ phản hồi
            if (error.data && error.data.error) {
                alert('Đổi mật khẩu thất bại! Chi tiết: ' + error.data.error);
            } else {
                alert('Đổi mật khẩu thất bại! Vui lòng thử lại.');
            }
        }).finally(function() {
            $scope.isSubmitting = false; // Đánh dấu kết thúc gửi
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
