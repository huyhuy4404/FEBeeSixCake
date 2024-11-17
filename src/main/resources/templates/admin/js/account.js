var app = angular.module("myApp", []);
        
app.controller("UserController", function($scope, $http) {
    $scope.users = [];
    $scope.filteredUsers = []; // Danh sách người dùng đã được lọc
    $scope.selectedUser = {};
    $scope.message = '';
    $scope.errorMessage = '';
    $scope.searchQuery = ''; // Trường lưu trữ giá trị tìm kiếm
    $scope.currentPage = 1; // Trang hiện tại
    $scope.pageSize = 4; // Số lượng bản ghi mỗi trang
    $scope.pages = []; // Danh sách các trang
    $scope.totalPages = 0; // Tổng số trang

    $scope.loadUsers = function() {
        console.log("Đang tải dữ liệu người dùng...");
        $http.get("http://localhost:8080/beesixcake/api/account")
            .then(function(response) {
                console.log("Dữ liệu nhận được:", response.data);
                $scope.users = response.data;
                $scope.filteredUsers = $scope.users; // Khởi tạo danh sách đã lọc bằng toàn bộ người dùng
                $scope.calculatePages();
                $scope.changePage(1); // Đặt về trang đầu tiên
                $scope.errorMessage = ''; // Xóa thông báo lỗi nếu có
                
            })
            .catch(function(error) {
                console.error('Lỗi khi tải dữ liệu:', error);
                $scope.errorMessage = "Lỗi khi tải dữ liệu: " + (error.statusText || 'Không xác định');
                $scope.message = ''; // Xóa thông báo thành công nếu có
            });
    };
    // Tính toán số trang
    $scope.calculatePages = function() {
        $scope.totalPages = Math.ceil($scope.users.length / $scope.pageSize);
        $scope.pages = Array.from({ length: $scope.totalPages }, (_, i) => i + 1);
    };

    // Thay đổi trang
    $scope.changePage = function(page) {
        if (page >= 1 && page <= $scope.totalPages) {
            $scope.currentPage = page;
            $scope.updateFilteredUsers();
        }
    };

    // Cập nhật danh sách người dùng hiển thị dựa trên trang hiện tại
    $scope.updateFilteredUsers = function() {
        const startIndex = ($scope.currentPage - 1) * $scope.pageSize;
        const endIndex = startIndex + $scope.pageSize;
        $scope.filteredUsers = $scope.users.slice(startIndex, endIndex);
    };
    
    $scope.searchUsers = function() {
        if (!$scope.searchQuery) {
            // Nếu không có giá trị tìm kiếm, hiển thị toàn bộ danh sách
            $scope.filteredUsers = $scope.users;
        } else {
            var query = $scope.searchQuery.toLowerCase();
            $scope.filteredUsers = $scope.users.filter(function(user) {
                return user.fullname.toLowerCase().includes(query) ||
                       user.email.toLowerCase().includes(query) ||
                       user.idaccount.toLowerCase().includes(query);
            });
        }
    };
    
    
    // Hàm thêm người dùng
    $scope.addUser = function() {
        $http.post("http://localhost:8080/beesixcake/api/account", $scope.selectedUser)
            .then(function(response) {
                $scope.loadUsers();
                $scope.selectedUser = {};
                $scope.message = "Thêm người dùng thành công!";
                $scope.errorMessage = ''; // Xóa thông báo lỗi nếu có
                $('#userModal').modal('hide'); // Đóng modal sau khi thêm thành công
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
                $('#userModal').modal('hide'); // Đóng modal sau khi cập nhật thành công
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
            active: true
        };
    };

    // Hàm mở khóa tài khoản
    $scope.unlockAccount = function (idaccount) {
        // Tìm người dùng để cập nhật active
        var user = $scope.users.find(u => u.idaccount === idaccount);
        if (user) {
            user.active = true;
            $http.put("http://localhost:8080/beesixcake/api/account/" + idaccount, user)
                .then(function (response) {
                $scope.message = "Tài khoản đã được mở khóa thành công!";
                $scope.errorMessage = ''; // Xóa thông báo lỗi nếu có
                    $scope.loadUsers(); // Tải lại danh sách người dùng
                })
                .catch(function (error) {
                console.error("Error unlocking account:", error);
                $scope.errorMessage = "Không thể mở khóa tài khoản. Vui lòng thử lại.";
                $scope.message = ''; // Xóa thông báo thành công nếu có
                });
        }
    };

    // Hàm khóa tài khoản
    $scope.lockAccount = function (idaccount) {
        // Tìm người dùng để cập nhật active
var user = $scope.users.find(u => u.idaccount === idaccount);
        if (user) {
            user.active = false;
            $http.put("http://localhost:8080/beesixcake/api/account/" + idaccount, user)
                .then(function (response) {
                    $scope.message = "Tài khoản đã bị khóa thành công!";
                    $scope.errorMessage = ''; // Xóa thông báo lỗi nếu có
                    $scope.loadUsers(); // Tải lại danh sách người dùng
                })
                .catch(function (error) {
                    console.error("Error locking account:", error);
                    $scope.errorMessage = "Không thể khóa tài khoản. Vui lòng thử lại.";
                    $scope.message = ''; // Xóa thông báo thành công nếu có
                });
        }
    };

    // Tải danh sách người dùng khi controller khởi tạo
    $scope.loadUsers();
});