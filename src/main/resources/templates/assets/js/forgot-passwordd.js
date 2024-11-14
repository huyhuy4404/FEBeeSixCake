var app = angular.module('myApp', []);

// Controller cho chức năng đặt lại mật khẩu
app.controller('ResetPasswordController', function($scope, $http, $window) {
    $scope.user = {
        email: ''
    };
    $scope.resetSuccess = '';
    $scope.resetError = '';
    $scope.isSubmitting = false; // Theo dõi trạng thái gửi

    $scope.sendResetLink = function() {
        // Kiểm tra nếu đang gửi để tránh gửi nhiều lần
        if ($scope.isSubmitting) {
            return;
        }

        // Kiểm tra tính hợp lệ của form
        if (!$scope.user.email) {
            $scope.resetError = 'Vui lòng nhập email!';
            return;
        }

        $scope.isSubmitting = true; // Đánh dấu là đang gửi

        // Gửi yêu cầu đến server để gửi liên kết đặt lại mật khẩu
        $http.post('http://localhost:8080/beesixcake/api/account/reset-password', { email: $scope.user.email })
            .then(function(response) {
                $scope.resetSuccess = response.data.message; // Hiển thị thông báo thành công
                $scope.resetError = ''; // Xóa thông báo lỗi nếu có
                
                // Chuyển hướng đến trang nhập mã OTP
                $window.location.href = "http://127.0.0.1:5500/src/main/resources/templates/assets/opt.html"; // Thay đổi URL theo yêu cầu
            })
            .catch(function(error) {
                // Kiểm tra xem có thông báo lỗi từ server không
                if (error.data && error.data.message) {
                    $scope.resetError = error.data.message; // Hiển thị thông báo lỗi từ server
                } else {
                    $scope.resetError = "Có lỗi xảy ra, vui lòng thử lại."; // Thông báo lỗi chung
                }
                $scope.resetSuccess = ''; // Xóa thông báo thành công nếu có
            })
            .finally(function() {
                $scope.isSubmitting = false; // Đánh dấu không còn đang gửi
            });
    };
});

// Controller cho chức năng xác thực OTP
app.controller('OTPController', function($scope, $http, $window) {
    $scope.otp = ['', '', '', '', '', ''];
    $scope.otpError = '';
    $scope.otpSuccess = '';

    $scope.submitOTP = function() {
        const otpValue = $scope.otp.join('');
        console.log('OTP Đã Nhập:', otpValue);

        // Gọi API để xác thực OTP
        $http.post('http://localhost:8080/beesixcake/api/account/validate-otp', { otp: otpValue })
        .then(function(response) {
            if (response.data.success) {
                $scope.otpSuccess = 'Xác thực thành công!';
                $scope.otpError = '';
                
                // Chuyển hướng đến trang đổi mật khẩu
                $window.location.href = "http://127.0.0.1:5500/src/main/resources/templates/assets/change-password.html"; // Thay đổi đường dẫn nếu cần
            } else {
                $scope.otpError = 'Mã OTP không chính xác!';
                $scope.otpSuccess = '';
            }
        })
        .catch(function(error) {
            $scope.otpError = 'Có lỗi xảy ra, vui lòng thử lại.';
            $scope.otpSuccess = '';
        });
    };

    $scope.moveFocus = function(index) {
        const inputs = document.querySelectorAll('.otp-input');
        if (inputs[index].value.length >= 1 && index < inputs.length - 1) {
            inputs[index + 1].focus();
        } else if (inputs[index].value.length === 0 && index > 0) {
            inputs[index - 1].focus();
        }
    };
});

// Controller cho chức năng kiểm tra đăng nhập
app.controller('CheckLogin', function($scope, $http, $window) {
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
    $scope.updateAccountMenu = function() {
        $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    };

    // Phương thức đăng xuất
    $scope.logout = function() {
        localStorage.removeItem("loggedInUser");
        $scope.isLoggedIn = false;
        $scope.loggedInUser = null;
        $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
    };
});

// Controller cho chức năng đổi mật khẩu
app.controller('ChangePasswordController', function($scope, $http, $window) {
    $scope.newPassword = '';
    $scope.confirmPassword = '';
    $scope.successMessage = '';
    $scope.errorMessage = '';

    $scope.changePassword = function() {
        if ($scope.newPassword !== $scope.confirmPassword) {
            $scope.errorMessage = 'Mật khẩu xác nhận không khớp!';
            return;
        }

        // Gửi yêu cầu đổi mật khẩu đến server
        $http.post('http://localhost:8080/beesixcake/api/account/change-password', { password: $scope.newPassword })
        .then(function(response) {
            if (response.data.success) {
                $scope.successMessage = 'Mật khẩu đã được đổi thành công!';
                $scope.errorMessage = '';
                // Chuyển hướng có thể đến trang đăng nhập hoặc trang khác nếu cần
                $window.location.href = "login.html"; // Thay đổi đường dẫn nếu cần
            } else {
                $scope.errorMessage = 'Có lỗi xảy ra, vui lòng thử lại.';
                $scope.successMessage = '';
            }
        })
        .catch(function(error) {
            $scope.errorMessage = 'Có lỗi xảy ra, vui lòng thử lại.';
            $scope.successMessage = '';
        });
    };
});