var app = angular.module("myApp", []);



app.controller("discountsController", function ($scope, $http) {
  // Khởi tạo mảng để chứa sản phẩm
  $scope.Products = [];
  $scope.category = [];
  $scope.filteredProducts = []; // Khởi tạo mảng để chứa sản phẩm đã lọc
  $scope.selectedCategory = '';

  // Lấy dữ liệu từ API
  $scope.getProducts = function () {
    // Gọi API để lấy danh sách sản phẩm
    $http.get('http://localhost:8080/beesixcake/api/product')
      .then(function (response) {
        console.log('Product Response:', response.data);

        if (!Array.isArray(response.data)) {
          console.error("Dữ liệu không phải mảng!");
          return;
        }

        // Lưu tất cả sản phẩm
        $scope.Products = response.data.map(item => ({
          idproduct: item.idproduct,
          productname: item.productname,
          img: item.img,
          isactive: item.isactive,
          categoryname: item.category.categoryname
        }));

        // Gọi API để lấy chi tiết từng sản phẩm
        return $http.get('http://localhost:8080/beesixcake/api/productdetail');
      })
      .then(function (response) {
        console.log('Product Detail Response:', response.data);

        if (!Array.isArray(response.data)) {
          console.error("Dữ liệu không phải mảng từ API chi tiết sản phẩm!");
          return;
        }

        // Kết hợp dữ liệu giá vào sản phẩm
        response.data.forEach(detail => {
          const product = $scope.Products.find(item => item.idproduct === detail.product.idproduct);
          if (product) {
            product.unitprice = detail.unitprice; // Giả sử unitprice có trong response này
          }
        });

        console.log('All Products:', $scope.Products);
      })
      .catch(function (error) {
        console.error("Error fetching data:", error);
      });
  };

  // Hàm lọc sản phẩm theo loại
  $scope.filterProducts = function (categoryName) {
    // Lưu tên loại sản phẩm để hiển thị
    $scope.selectedCategory = categoryName;

    // Lọc sản phẩm theo loại từ danh sách sản phẩm
    $scope.filteredProducts = $scope.Products.filter(product => product.categoryname === categoryName);

    // Kiểm tra xem có sản phẩm nào được lọc không
    if ($scope.filteredProducts.length > 0) {
      console.log('Filtered Products:', $scope.filteredProducts);
    } else {
      console.log('Không có sản phẩm nào cho loại: ' + categoryName);
    }

    // Chuyển hướng đến trang sản phẩm
    window.location.href = 'SanPham.html#/' + categoryName;
  };

  // Hàm lấy danh mục sản phẩm
  $scope.getCategories = function () {
    $http.get('http://localhost:8080/beesixcake/api/category')
      .then(function (response) {
        console.log('Category Response:', response.data);
        
        if (Array.isArray(response.data)) {
          $scope.category = response.data.map(item => ({
            idcategory: item.idcategory,
            categoryname: item.categoryname
          }));
          console.log('All Categories:', $scope.category);
        } else {
          console.error("Dữ liệu không phải mảng!");
        }
      })
      .catch(function (error) {
        console.error("Error fetching categories:", error);
      });
  };

  // Hàm chuyển hướng đến trang chi tiết sản phẩm
  $scope.goToProduct = function (productId) {
    if (productId) {
      const url = "http://127.0.0.1:5500/src/main/resources/templates/assets/chitietsanpham.html?id=" + productId;
      window.location.href = url;
    } else {
      console.log("Product ID is not valid.");
    }
  };

  // Hàm định dạng tiền tệ
  $scope.formatCurrency = function (amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Gọi hàm để lấy dữ liệu
  $scope.getProducts();
  $scope.getCategories(); // Gọi hàm lấy danh mục
});
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
    // Nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    $window.location.href = "login.html"; // Đường dẫn đến trang đăng nhập
  }

  // Hàm cập nhật giao diện
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
  };

  $scope.changePassword = function () {
    // Reset thông báo lỗi và thành công
    $scope.changePasswordError = "";
    $scope.changePasswordSuccess = "";

    // Kiểm tra mật khẩu hiện tại
    if ($scope.user.currentPassword !== $scope.loggedInUser.password) {
      $scope.changePasswordError = "Mật khẩu hiện tại không đúng!";
      return;
    }

    // Kiểm tra mật khẩu mới và xác nhận mật khẩu
    if ($scope.user.newPassword !== $scope.user.confirmPassword) {
      $scope.changePasswordError = "Mật khẩu mới và xác nhận mật khẩu không khớp!";
      return;
    }

    // Gửi yêu cầu PUT để cập nhật mật khẩu
    var updatedAccount = {
      ...$scope.loggedInUser,
      password: $scope.user.newPassword // Cập nhật mật khẩu mới
    };

    $http.put("http://localhost:8080/beesixcake/api/account/" + updatedAccount.idaccount, updatedAccount)
      .then(function (response) {
        // Cập nhật thông tin trong localStorage
        localStorage.setItem("loggedInUser", JSON.stringify(updatedAccount));
        $scope.changePasswordSuccess = "Đổi mật khẩu thành công!";
        $scope.loggedInUser.password = $scope.user.newPassword; // Cập nhật mật khẩu trong phiên làm việc
      })
      .catch(function (error) {
        // Xử lý lỗi từ API
        $scope.changePasswordError = "Lỗi khi cập nhật mật khẩu. Vui lòng thử lại.";
        console.error("Error:", error);
      });
  };
  // Phương thức đăng nhập
  $scope.login = function () {
    if (!$scope.isLoggedIn) {
      $scope.loginError = ""; // Reset thông báo lỗi

      // Gửi yêu cầu GET để lấy danh sách tài khoản từ API
      $http.get("http://localhost:8080/beesixcake/api/account")
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
              localStorage.setItem("loggedInUser", JSON.stringify(foundAccount));

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