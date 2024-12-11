app.controller("RegisterController", function ($scope, $http, $window, $timeout) {
    // Khởi tạo thông tin tài khoản
    $scope.user = {
        idaccount: '',   // Tên tài khoản
        password: '',    // Mật khẩu
        confirmPassword: '',  // Nhập lại mật khẩu
        fullname: '',    // Họ và tên
        email: '',       // Email
        phonenumber: '', // Số điện thoại
        active: true,    // Trạng thái tài khoản
        idrole: 2        // Quyền mặc định là 2 (người dùng)
    };

    // Biến lưu thông báo
    $scope.registerSuccess = '';
    $scope.registerError = '';

    // Phương thức đăng ký tài khoản
    $scope.register = function () {
        // Reset thông báo
        $scope.registerSuccess = '';
        $scope.registerError = '';

        // Kiểm tra tính hợp lệ của form
        if (!$scope.regisForm.$valid) {
            $scope.registerError = 'Vui lòng kiểm tra lại thông tin trong form.';
            return; // Dừng lại nếu form không hợp lệ
        }

        // Kiểm tra xem mật khẩu và mật khẩu nhập lại có khớp không
        if ($scope.user.password !== $scope.user.confirmPassword) {
            $scope.registerError = 'Mật khẩu và mật khẩu nhập lại không khớp!';
            return;
        }

        // Gửi yêu cầu đăng ký
        $http({
            method: "POST",
            url: "http://localhost:8080/beesixcake/api/account",
            data: $scope.user
        }).then(function (response) {
            if (response.data && response.data.success) {
                // Hiển thị thông báo thành công
                $scope.registerSuccess = 'Đăng ký thành công! Vui lòng đăng nhập.';
                $scope.registerError = ''; // Xóa thông báo lỗi
                $timeout(function () {
                    $window.location.href = 'login.html';
                }, 2000); // Chuyển hướng sau 2 giây
            } else if (response.data && response.data.error) {
                // Hiển thị lỗi nếu có
                $scope.registerError = parseErrorMessage(response.data.error);
                $scope.registerSuccess = ''; // Xóa thông báo thành công
            } else {
                $scope.registerSuccess = 'Đăng ký thành công! Vui lòng đăng nhập.'; // Xóa thông báo thành công
                $timeout(function () {
                    $window.location.href = 'login.html';
                }, 2000); // Chuyển hướng sau 2 giây
            }
        }).catch(function (error) {
            if (error.data && error.data.error) {
                const errorDetails = error.data.error.details || JSON.stringify(error.data.error);
                $scope.registerError = `${errorDetails.replace(/["{}]/g, '')}`;
            } else {
                $scope.registerError = 'Đăng ký thất bại! Không thể kết nối tới máy chủ.';
            }
            $scope.registerSuccess = ''; // Xóa thông báo thành công
            console.error('Chi tiết lỗi:', error);
        });
    };

    // Hàm phân tích lỗi từ API
    function parseErrorMessage(error) {
        if (!error) return 'Đã xảy ra lỗi không xác định.';

        // Kiểm tra mã lỗi cụ thể
        switch (error.code) {
            case 'DUPLICATE_IDACCOUNT':
                return 'Tên tài khoản đã tồn tại. Vui lòng chọn tên khác.';
            case 'DUPLICATE_EMAIL':
                return 'Email đã được sử dụng. Vui lòng thử email khác.';
            case 'INVALID_EMAIL':
                return 'Email không hợp lệ.';
            case 'WEAK_PASSWORD':
                return 'Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu mạnh hơn.';
            case 'MISSING_FIELD':
                return `Trường thông tin "${error.field}" không được để trống.`;
            default:
                return error.message || 'Đăng ký thất bại! Vui lòng thử lại.';
        }
    }
});
