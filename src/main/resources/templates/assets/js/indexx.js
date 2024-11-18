var app = angular.module("myApp", []);

app.controller(
  "discountsController",
  function ($scope, $http, $location, $window) {
    $scope.Products = [];
    $scope.category = [];
    $scope.filteredProducts = [];
    $scope.selectedCategory = "";

    // Lấy danh mục sản phẩm từ API
    $scope.getCategories = function () {
      $http
        .get("http://localhost:8080/beesixcake/api/category")
        .then(function (response) {
          if (Array.isArray(response.data)) {
            $scope.category = response.data.map((item) => ({
              idcategory: item.idcategory,
              categoryname: item.categoryname,
            }));
          } else {
            console.error("Dữ liệu không phải mảng!");
          }
        })
        .catch(function (error) {
          console.error("Lỗi khi lấy danh mục:", error);
        });
    };

    // Lấy danh sách sản phẩm từ API
    $scope.getProducts = function () {
      $http
        .get("http://localhost:8080/beesixcake/api/product")
        .then(function (response) {
          if (!Array.isArray(response.data)) {
            console.error("Dữ liệu không phải mảng!");
            return;
          }

          $scope.Products = response.data.map((item) => ({
            idproduct: item.idproduct,
            productname: item.productname,
            img: item.img,
            unitprice: item.unitprice,
            categoryname: item.category.categoryname,
          }));

          // Áp dụng lọc sản phẩm nếu đã có danh mục được chọn
          $scope.applyFilterFromLocalStorage();
        })
        .catch(function (error) {
          console.error("Lỗi khi lấy sản phẩm:", error);
        });
    };

    // Lưu danh mục được chọn và chuyển hướng
    $scope.filterProducts = function (categoryName) {
      localStorage.setItem("selectedCategory", categoryName); // Lưu danh mục vào localStorage
      $window.location.href = "SanPham.html"; // Chuyển hướng đến trang sản phẩm
    };

    // Áp dụng bộ lọc sản phẩm từ localStorage
    $scope.applyFilterFromLocalStorage = function () {
      const selectedCategory = localStorage.getItem("selectedCategory"); // Lấy danh mục từ localStorage
      if (selectedCategory) {
        $scope.selectedCategory = selectedCategory;
        $scope.filteredProducts = $scope.Products.filter(
          (product) => product.categoryname === selectedCategory
        );
      } else {
        $scope.filteredProducts = $scope.Products; // Hiển thị tất cả sản phẩm nếu không có danh mục
      }
    };

    // Khởi tạo dữ liệu khi tải trang
    $scope.getCategories();
    $scope.getProducts();
  }
);
app.controller("CheckLogin", function ($scope, $http, $window, $timeout) {
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
    // Không chuyển hướng ở đây, để người dùng vào trang index mà không cần đăng nhập
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
  }

  // Hàm cập nhật giao diện
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
    $scope.loggedInUser = $scope.isLoggedIn
      ? JSON.parse(localStorage.getItem("loggedInUser"))
      : null;
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
              $window.location.href = "index.html";
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
    $window.location.href = "index.html"; // Chuyển về trang chính sau khi đăng xuất
  };

  // Gọi cập nhật giao diện khi controller được khởi tạo
  $scope.updateAccountMenu();
});
