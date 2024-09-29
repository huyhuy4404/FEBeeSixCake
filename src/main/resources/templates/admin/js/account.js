var app = angular.module("myApp", []);

app.controller("UserController", function($scope, $http) {
    $scope.users = []; // Mảng để lưu danh sách người dùng
    $scope.selectedUser = {}; // Đối tượng để lưu thông tin người dùng được chọn

    // Hàm tải danh sách người dùng
    $scope.loadUsers = function() {
        console.log("Đang tải dữ liệu người dùng...");
        $http.get("http://localhost:8080/beesixcake/api/account")
            .then(function(response) {
                console.log("Dữ liệu nhận được:", response.data); // In ra dữ liệu
                $scope.users = response.data; // Lưu dữ liệu vào mảng users
            })
            .catch(function(error) {
                console.error('Lỗi khi tải dữ liệu:', error);
                alert("Lỗi khi tải dữ liệu: " + error.statusText); // Hiển thị thông báo lỗi
            });
    };
    

    // Hàm thêm người dùng
    $scope.addUser = function() {
        $http.post("http://localhost:8080/beesixcake/api/account", $scope.selectedUser)
            .then(function(response) {
                $scope.loadUsers(); // Tải lại danh sách người dùng
                $scope.selectedUser = {}; // Xóa thông tin người dùng đã chọn
                alert("Thêm người dùng thành công!");
            })
            .catch(function(error) {
                console.error('Lỗi khi thêm người dùng:', error);
                alert("Thêm người dùng thất bại!");
            });
    };

    // Hàm cập nhật người dùng
    $scope.updateUser = function() {
        $http.put("http://localhost:8080/beesixcake/api/account/" + $scope.selectedUser.idaccount, $scope.selectedUser)
            .then(function(response) {
                $scope.loadUsers(); // Tải lại danh sách người dùng
                $scope.selectedUser = {}; // Xóa thông tin người dùng đã chọn
                alert("Cập nhật người dùng thành công!");
            })
            .catch(function(error) {
                console.error('Lỗi khi cập nhật người dùng:', error);
                alert("Cập nhật người dùng thất bại!");
            });
    };

    // Hàm xóa người dùng
    $scope.deleteUser = function(id) {
        if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
            $http.delete("http://localhost:8080/beesixcake/api/account/" + id)
                .then(function(response) {
                    $scope.loadUsers(); // Tải lại danh sách người dùng
                    alert("Xóa người dùng thành công!");
                })
                .catch(function(error) {
                    console.error('Lỗi khi xóa người dùng:', error);
                    alert("Xóa người dùng thất bại!");
                });
        }
    };
    $scope.editUser = function(user) {
        $scope.selectedUser = angular.copy(user); // Sao chép thông tin người dùng vào selectedUser
    };
    $scope.editUser = function(user) {
        $scope.selectedUser = angular.copy(user); // Sao chép thông tin người dùng vào selectedUser
        // Chuyển đến tab "Edit"
        document.querySelector('#edit-tab').click(); 
    };

    // Chức năng cập nhật người dùng
    $scope.updateUser = function() {
        $http.put(`http://localhost:8080/beesixcake/api/account/${$scope.selectedUser.idaccount}`, $scope.selectedUser)
            .then(function(response) {
                $scope.resetForm; // Tải lại danh sách người dùng
                $scope.selectedUser = {}; // Reset selectedUser
            })
            .catch(function(error) {
                console.error('Error updating user:', error);
            });
    };

    // Chức năng xóa người dùng
    $scope.deleteUser = function(id) {
        if (confirm('Bạn có chắc chắn muốn xóa người dùng này không?')) {
            $http.delete(`http://localhost:8080/beesixcake/api/account/${id}`)
                .then(function(response) {
                    $scope.resetForm; // Tải lại danh sách người dùng
                })
                .catch(function(error) {
                    console.error('Error deleting user:', error);
                });
        }
    };

    // Gọi hàm loadUsers khi controller được khởi tạo
    $scope.loadUsers();
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
    
});
