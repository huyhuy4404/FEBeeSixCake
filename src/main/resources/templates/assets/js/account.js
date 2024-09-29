var app = angular.module('myApp', ["ngRoute"]);

app.controller("LoginController", function($scope, $http, $window, $timeout) {
    // Khởi tạo thông tin người dùng và trạng thái đăng nhập
    $scope.isLoggedIn = false;
    $scope.user = {
        idaccount: '',
        password: ''
    };
    $scope.loginError = ''; // Biến để lưu thông báo lỗi

    // Kiểm tra trạng thái đăng nhập từ localStorage
    if (localStorage.getItem('loggedInUser')) {
        $scope.isLoggedIn = true;
        $scope.loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    }

    // Phương thức đăng nhập
    $scope.login = function() {
        if (!$scope.isLoggedIn) {
            $scope.loginError = ''; // Reset thông báo lỗi

            // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
            $http.get("http://localhost:8080/beesixcake/api/account")
                .then(function(response) {
                    $scope.accounts = response.data;
                    var foundAccount = $scope.accounts.find(account =>
                        account.idaccount === $scope.user.idaccount &&
                        account.password === $scope.user.password
                    );

                    if (foundAccount) {
                        if (foundAccount.admin) {
                            // Nếu tài khoản là admin
                            $scope.loginError = 'Bạn không có quyền truy cập!';
                        } else {
                            // Đăng nhập thành công
                            $scope.loginSuccess = 'Đăng nhập thành công!';
                            // Lưu thông tin đăng nhập vào localStorage
                            localStorage.setItem('loggedInUser', JSON.stringify(foundAccount));
                            // Chờ 3 giây trước khi chuyển hướng
                            $timeout(function() {
                                $window.location.href = 'index.html';
                            }, 3000);
                        }
                    } else {
                        // Nếu tài khoản không đúng hoặc mật khẩu không khớp
                        $scope.loginError = 'Tên người dùng hoặc mật khẩu không đúng!';
                    }
                })
                .catch(function(error) {
                    // Xử lý lỗi từ API
                    $scope.loginError = 'Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.';
                    console.error('Error:', error);
                });
        } else {
            alert('Bạn đã đăng nhập rồi.');
        }
    };

    // Phương thức đăng xuất
    $scope.logout = function() {
        localStorage.removeItem('loggedInUser');
        $scope.isLoggedIn = false;
        $scope.loggedInUser = null;
        $window.location.href = 'login.html'; // Chuyển về trang đăng nhập sau khi đăng xuất
    };
});
