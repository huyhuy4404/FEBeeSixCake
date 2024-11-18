const allCategory = "http://localhost:8080/beesixcake/api/category";
const categoryApi = "http://localhost:8080/beesixcake/api/category"; // API endpoint

var app = angular.module('myApp', []);
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
app.controller('CategoryController', function($scope, $http) {
    // Thêm biến để kiểm tra trạng thái thêm/sửa
    $scope.isEditing = false;  // Mặc định là chế độ thêm mới

    // Lấy danh sách loại sản phẩm từ API
    $scope.getCategories = function() {
        $http.get('http://localhost:8080/beesixcake/api/category')
            .then(function(response) {
                $scope.categories = response.data; // Lưu danh sách loại sản phẩm
            }, function(error) {
                console.log('Error fetching categories:', error);
            });
    };

    // Thêm loại sản phẩm mới
    $scope.addCategory = function() {
        var newCategory = {
            categoryname: $scope.selectedCategory.categoryname
        };

        $http.post('http://localhost:8080/beesixcake/api/category', newCategory)
            .then(function(response) {
                alert('Thêm loại sản phẩm thành công!');
                $scope.getCategories(); // Tải lại danh sách sau khi thêm
                $scope.resetForm(); // Làm mới form
                $scope.isEditing = false; // Đặt lại chế độ thêm mới
            }, function(error) {
                console.log('Error adding category:', error);
            });
    };

    // Chỉnh sửa loại sản phẩm
    $scope.editCategory = function() {
        var editedCategory = {
            idcategory: $scope.selectedCategory.idcategory,
            categoryname: $scope.selectedCategory.categoryname
        };

        $http.put('http://localhost:8080/beesixcake/api/category/' + editedCategory.idcategory, editedCategory)
            .then(function(response) {
                alert('Sửa loại sản phẩm thành công!');
                $scope.getCategories(); // Tải lại danh sách sau khi sửa
                $scope.resetForm(); // Làm mới form
                $scope.isEditing = false; // Chuyển về chế độ thêm mới
            }, function(error) {
                console.log('Error editing category:', error);
            });
    };

    // Xóa loại sản phẩm
    $scope.deleteCategory = function(category) {
        if (confirm('Bạn có chắc chắn muốn xóa loại sản phẩm này?')) {
            $http.delete('http://localhost:8080/beesixcake/api/category/' + category.idcategory)
                .then(function(response) {
                    alert('Xóa loại sản phẩm thành công!');
                    $scope.getCategories(); // Tải lại danh sách sau khi xóa
                }, function(error) {
                    console.log('Error deleting category:', error);
                });
        }
    };

    // Đưa dữ liệu sản phẩm vào form để chỉnh sửa
    $scope.goToEdit = function(category) {
        $scope.selectedCategory = angular.copy(category);
        $scope.isEditing = true; // Chuyển sang chế độ chỉnh sửa
    };

    // Làm mới form
    $scope.resetForm = function() {
        $scope.selectedCategory = {}; // Reset form
    };

    // Khởi động: Tải danh sách loại sản phẩm ngay khi trang được tải
    $scope.getCategories();
});
