var app = angular.module("myApp", []);

app.controller("UserController", function($scope, $http) {
    $scope.users = [];
    $scope.selectedUser = {};
    $scope.message = '';
    $scope.errorMessage = '';

    // Hàm tải danh sách người dùng
    $scope.loadUsers = function() {
        console.log("Đang tải dữ liệu người dùng...");
        $http.get("http://localhost:8080/beesixcake/api/account")
            .then(function(response) {
                console.log("Dữ liệu nhận được:", response.data);
                $scope.users = response.data;
                $scope.message = "Dữ liệu người dùng đã tải thành công!";
                $scope.errorMessage = ''; // Xóa thông báo lỗi nếu có
            })
            .catch(function(error) {
                console.error('Lỗi khi tải dữ liệu:', error);
                $scope.errorMessage = "Lỗi khi tải dữ liệu: " + error.statusText;
                $scope.message = ''; // Xóa thông báo thành công nếu có
            });
    };

    // Hàm thêm người dùng
    $scope.addUser = function() {
        $http.post("http://localhost:8080/beesixcake/api/account", $scope.selectedUser)
            .then(function(response) {
                $scope.loadUsers();
                $scope.selectedUser = {};
                $scope.message = "Thêm người dùng thành công!";
                $scope.errorMessage = ''; // Xóa thông báo lỗi nếu có
            })
            .catch(function(error) {
                console.error('Lỗi khi thêm người dùng:', error);
                $scope.errorMessage = "Thêm người dùng thất bại!";
                $scope.message = ''; // Xóa thông báo thành công nếu có
            });
    };

    // Hàm cập nhật người dùng
    $scope.updateUser = function() {
        $http.put("http://localhost:8080/beesixcake/api/account/" + $scope.selectedUser.idaccount, $scope.selectedUser)
            .then(function(response) {
                $scope.loadUsers();
                $scope.selectedUser = {};
                $scope.message = "Cập nhật người dùng thành công!";
                $scope.errorMessage = ''; // Xóa thông báo lỗi nếu có
            })
            .catch(function(error) {
                console.error('Lỗi khi cập nhật người dùng:', error);
                $scope.errorMessage = "Cập nhật người dùng thất bại!";
                $scope.message = ''; // Xóa thông báo thành công nếu có
            });
    };

    // Hàm xóa người dùng
    $scope.deleteUser = function(id) {
        if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
            $http.delete("http://localhost:8080/beesixcake/api/account/" + id)
                .then(function(response) {
                    $scope.loadUsers();
                    $scope.message = "Xóa người dùng thành công!";
                    $scope.errorMessage = ''; // Xóa thông báo lỗi nếu có
                })
                .catch(function(error) {
                    console.error('Lỗi khi xóa người dùng:', error);
                    $scope.errorMessage = "Xóa người dùng thất bại!";
                    $scope.message = ''; // Xóa thông báo thành công nếu có
                });
        }
    };

    // Chỉnh sửa người dùng
    $scope.editUser = function(user) {
        $scope.selectedUser = angular.copy(user);
        document.querySelector('#edit-tab').click(); 
    };

    // Khởi tạo form
    $scope.resetForm = function() {
        $scope.selectedUser = {
            idaccount: '',
            password: '',
            fullname: '',
            email: '',
            phonenumber: '',
            idrole: null,
            active: false
        };
    };

    // Tải danh sách người dùng khi controller khởi tạo
    $scope.loadUsers();
});
