const categoryApi = "http://localhost:8080/beesixcake/api/category"; // API endpoint

var app = angular.module('myApp', []);
app.controller("CheckLogin", function ($scope, $http, $window) {
  // Khởi tạo thông tin người dùng và trạng thái đăng nhập
  $scope.isLoggedIn = false;
  $scope.user = {
    idaccount: "",
    password: "",
  };

  // Kiểm tra trạng thái đăng nhập từ localStorage
  if (localStorage.getItem("loggedInUser")) {
    $scope.isLoggedIn = true;
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  } else {
    $window.location.href = "login.html"; // Chuyển hướng nếu chưa đăng nhập
  }

  // Hàm cập nhật giao diện
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
  };

  // Phương thức đăng nhập
  $scope.login = function () {
    if (!$scope.isLoggedIn) {
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
              showMessageModal("Bạn không có quyền truy cập!");
            } else {
              showMessageModal("Đăng nhập thành công!");
              localStorage.setItem(
                "loggedInUser",
                JSON.stringify(foundAccount)
              );
              $scope.updateAccountMenu();
              $window.location.href = "index.html";
            }
          } else {
            showMessageModal("Tên người dùng hoặc mật khẩu không đúng!");
          }
        })
        .catch(function (error) {
          showMessageModal("Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.");
          console.error("Error:", error);
        });
    } else {
      showMessageModal("Bạn đã đăng nhập rồi.");
    }
  };

  // Phương thức đăng xuất
  $scope.logout = function () {
    localStorage.removeItem("loggedInUser");
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
    $window.location.href = "login.html"; // Chuyển về trang đăng nhập
  };
});

app.controller("CategoryController", function ($scope, $http) {
  // Biến kiểm tra trạng thái thêm/sửa
  $scope.isEditing = false;

  // Lấy danh sách loại sản phẩm từ API
  $scope.getCategories = function () {
    $http
      .get(categoryApi)
      .then(function (response) {
        $scope.categories = response.data;
      })
      .catch(function (error) {
        showMessageModal("Lỗi khi lấy danh sách loại sản phẩm: " + error.message);
      });
  };

  // Thêm loại sản phẩm mới
  $scope.addCategory = function () {
    const newCategory = { categoryname: $scope.selectedCategory.categoryname };

    $http
      .post(categoryApi, newCategory)
      .then(function (response) {
        showMessageModal("Thêm loại sản phẩm thành công!");
        $scope.getCategories();
        $scope.resetForm();
      })
      .catch(function (error) {
        showMessageModal("Lỗi khi thêm loại sản phẩm: " + error.message);
      });
  };

  // Chỉnh sửa loại sản phẩm
  $scope.editCategory = function () {
    const editedCategory = {
      idcategory: $scope.selectedCategory.idcategory,
      categoryname: $scope.selectedCategory.categoryname,
    };

    $http
      .put(`${categoryApi}/${editedCategory.idcategory}`, editedCategory)
      .then(function (response) {
        showMessageModal("Sửa loại sản phẩm thành công!");
        $scope.getCategories();
        $scope.resetForm();
      })
      .catch(function (error) {
        showMessageModal("Lỗi khi sửa loại sản phẩm: " + error.message);
      });
  };

  // Xóa loại sản phẩm
// Xóa loại sản phẩm
$scope.deleteCategory = function (category) {
  showMessageModal(
      "Bạn có chắc chắn muốn xóa loại sản phẩm này?",
      true,
      function () {
          $http
              .delete(`${categoryApi}/${category.idcategory}`)
              .then(function (response) {
                  showMessageModal("Xóa loại sản phẩm thành công!");
              })
              .catch(function (error) {
                  showMessageModal("Loại sản phẩm đã được một sản phẩm chọn không thể xóa!");
              })
              .finally(function () {
                  // Tải lại danh sách loại sản phẩm bất kể thành công hay thất bại
                  $scope.getCategories();
              });
      }
  );
};

  

  $scope.goToEdit = function (category) {
    // Đưa thông tin của sản phẩm được chọn vào form chỉnh sửa
    $scope.selectedCategory = angular.copy(category);
    $scope.isEditing = true;
  
    // Tự động chuyển sang tab "Chỉnh sửa loại sản phẩm"
    const editTab = document.querySelector('#profile-tab');
    const tabInstance = new bootstrap.Tab(editTab);
    tabInstance.show(); // Kích hoạt tab "Chỉnh sửa loại sản phẩm"
  };
  

  // Làm mới form
  $scope.resetForm = function () {
    $scope.selectedCategory = {};
    $scope.isEditing = false;
  };

  // Khởi động
  $scope.getCategories();
});
