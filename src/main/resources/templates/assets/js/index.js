var app = angular.module("myApp", []);

app.controller("discountsController", function ($scope, $http) {
  // Khởi tạo mảng để chứa sản phẩm
  $scope.Products = [];
  $scope.CartItems = [];
  $scope.DiscountedProducts = [];
  $scope.NewProducts = [];

  // Lấy dữ liệu từ hai API và kết hợp chúng
  $scope.getProducts = function () {
    $http.get('http://localhost:8080/beesixcake/api/productdetail')
      .then(function (response) {
        // Kiểm tra dữ liệu từ API
        console.log('Product Detail Response:', response.data);

        // Kiểm tra xem dữ liệu có hợp lệ không
        if (!Array.isArray(response.data)) {
          console.error("Dữ liệu không phải mảng!");
          return;
        }

        // Lưu tất cả sản phẩm
        $scope.Products = response.data.map(item => ({
          idproduct: item.product.idproduct,
          productname: item.product.productname,
          img: item.product.img,
          unitprice: item.unitprice,
          isactive: item.product.isactive, // Lưu trạng thái isactive
          categoryname: item.product.category.categoryname
        }));

        // Lưu sản phẩm có isactive là true
        $scope.ActiveProducts = $scope.Products.filter(item => item.isactive);

        // Kiểm tra sản phẩm
        console.log('All Products:', $scope.Products);
        console.log('Active Products:', $scope.ActiveProducts);
      })
      .catch(function (error) {
        console.error("Error fetching data:", error);
      });
  };
  $scope.formatCurrency = function (amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
  // Hàm lọc sản phẩm theo tên loại
  $scope.filterProducts = function (categoryName, startingLetter) {
    if (categoryName === 'Bánh') {
        // Lọc các sản phẩm có categoryname chứa 'Bánh' và productname bắt đầu bằng ký tự cụ thể
        $scope.FilteredProducts = $scope.ActiveProducts.filter(product =>
            product.categoryname.includes("Bánh") && product.productname.startsWith(startingLetter)
        );
    } else {
        // Nếu không phải loại 'Bánh', lọc theo tên loại đã chọn
        $scope.FilteredProducts = $scope.ActiveProducts.filter(product => product.categoryname === categoryName);
    }

    // Kiểm tra danh sách sản phẩm đã lọc
    console.log('Filtered Products:', $scope.FilteredProducts);
};
  

  // Hàm chuyển hướng đến trang chi tiết sản phẩm
  $scope.goToProduct = function (productId) {
    if (productId) {
      var url = "http://127.0.0.1:5500/src/main/resources/templates/assets/chitietsanpham.html?id=" + productId;
      window.location.href = url;
    } else {
      console.log("Product ID is not valid.");
    }
  };

  // Gọi hàm để lấy dữ liệu
  $scope.getProducts();
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