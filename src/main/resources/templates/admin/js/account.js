var app = angular.module("myApp", []);
app.controller("CheckLogin", function ($scope, $http, $window) {
    // Khởi tạo thông tin người dùng và trạng thái đăng nhập
    $scope.isLoggedIn = false;
    $scope.user = {
      idaccount: "",
      password: "",
    };
    $scope.loginError = ""; // Biến để lưu thông báo lỗi
  
    // Kiểm tra trạng thái đăng nhập từ localStorage
    if (localStorage.getItem("loggedInUser")) {
      $scope.isLoggedIn = true;
      $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    } else {
      // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
      $window.location.href = "login.html"; // Đường dẫn đến trang đăng nhập
    }
  
    // Hàm cập nhật giao diện
    $scope.updateAccountMenu = function () {
      $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    };
  
    // Phương thức đăng nhập
    $scope.login = function () {
      if (!$scope.isLoggedIn) {
        $scope.loginError = ""; // Reset thông báo lỗi
  
        // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
        $http
          .get("http://localhost:8080/beesixcake/api/account")
          .then(function (response) {
            $scope.accounts = response.data;
            var foundAccount = $scope.accounts.find(
              (account) =>
                account.idaccount === $scope.user.idaccount &&
                account.password === $scope.user.password
            );
  
            if (foundAccount) {
              if (foundAccount.admin) {
                // Nếu tài khoản là admin
                $scope.loginError = "Bạn không có quyền truy cập!";
              } else {
                // Đăng nhập thành công
                $scope.loginSuccess = "Đăng nhập thành công!";
                // Lưu thông tin đăng nhập vào localStorage
                localStorage.setItem(
                  "loggedInUser",
                  JSON.stringify(foundAccount)
                );
  
                // Cập nhật giao diện
                $scope.updateAccountMenu();
  
                // Chuyển hướng về trang chính ngay lập tức
                $window.location.href = "index.html"; // Hoặc sử dụng $timeout nếu cần delay
              }
            } else {
              // Nếu tài khoản không đúng hoặc mật khẩu không khớp
              $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
            }
          })
          .catch(function (error) {
            // Xử lý lỗi từ API
            $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
            console.error("Error:", error);
          });
      } else {
        alert("Bạn đã đăng nhập rồi.");
      }
    };
  
    // Phương thức đăng xuất
    $scope.logout = function () {
      localStorage.removeItem("loggedInUser");
      $scope.isLoggedIn = false;
      $scope.loggedInUser = null;
      $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
    };
  });      
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
     // Phương thức mở tài khoản
     $scope.unlockAccount = function (idaccount) {
        $scope.selectedAccount = idaccount; // Lưu ID tài khoản được chọn
        $('#unlockAccountModal').modal('show'); // Hiển thị modal mở khóa
    };
    
    $('#confirmUnlockBtn').click(function () {
        $scope.$apply(function () { // Đảm bảo AngularJS theo dõi thay đổi
            var idaccount = $scope.selectedAccount;
            var user = $scope.users.find(u => u.idaccount === idaccount);
            if (user) {
                if (user.idrole === 1) { // Không cho phép mở khóa admin
                    $('#unlockErrorMessage').text("Không thể mở khóa tài khoản admin!").removeClass('d-none');
                    return;
                }
    
                user.active = true; // Cập nhật trạng thái người dùng
                $http.put("http://localhost:8080/beesixcake/api/account/" + idaccount, user)
                    .then(function (response) {
                        $('#unlockSuccessMessage').text("Mở khóa tài khoản thành công!").removeClass('d-none');
                        $('#unlockErrorMessage').addClass('d-none');
                        $scope.loadUsers(); // Tải lại danh sách người dùng
                        
                        // Ẩn thông báo sau 2 giây
                        setTimeout(function () {
                            $('#unlockSuccessMessage').addClass('d-none');
                        }, 2000);
    
                        // Đóng modal sau khi hoàn tất
                        setTimeout(() => $('#unlockAccountModal').modal('hide'), 1500); // Đóng modal sau 1.5 giây
                    })
                    .catch(function (error) {
                        console.error("Error unlocking account:", error);
                        $('#unlockErrorMessage').text("Không thể mở khóa tài khoản. Vui lòng thử lại.").removeClass('d-none');
                        $('#unlockSuccessMessage').addClass('d-none');
                    });
            }
        });
    });
    
    
  // Phương thức khóa tài khoản
  $scope.lockAccount = function (idaccount) {
    $scope.selectedAccount = idaccount; // Lưu ID tài khoản được chọn
    $('#lockAccountModal').modal('show'); // Hiển thị modal khóa
};

$scope.confirmLockAccount = function () {
    var idaccount = $scope.selectedAccount;
    var user = $scope.users.find(u => u.idaccount === idaccount);
    if (user) {
        if (user.idrole === 1) { // Không cho phép khóa admin
            $('#lockErrorMessage').text("Không thể khóa tài khoản admin!").removeClass('d-none');
            return;
        }

        user.active = false; // Cập nhật trạng thái người dùng
        $http.put("http://localhost:8080/beesixcake/api/account/" + idaccount, user)
            .then(function (response) {
                $('#lockSuccessMessage').text("Khóa tài khoản thành công!").removeClass('d-none');
                $('#lockErrorMessage').addClass('d-none');
                $scope.loadUsers(); // Tải lại danh sách người dùng

                // Ẩn thông báo sau 2 giây
                setTimeout(function () {
                    $('#lockSuccessMessage').addClass('d-none');
                }, 2000);

                // Đóng modal sau khi hoàn tất
                setTimeout(() => $('#lockAccountModal').modal('hide'), 1500); // Đóng modal sau 1.5 giây
            })
            .catch(function (error) {
                console.error("Error locking account:", error);
                $('#lockErrorMessage').text("Không thể khóa tài khoản. Vui lòng thử lại.").removeClass('d-none');
                $('#lockSuccessMessage').addClass('d-none');
            });
    }
};

// Liên kết sự kiện xác nhận khóa
$('#confirmLockBtn').click(function () {
    $scope.$apply(function () {
        $scope.confirmLockAccount();
    });
});
    
  


    // Tải danh sách người dùng khi controller khởi tạo
    $scope.loadUsers();
});