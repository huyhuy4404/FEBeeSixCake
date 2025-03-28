var app = angular.module("myApp", []);

app.controller("discountsController", function ($scope, $http) {
  // Khởi tạo mảng để chứa sản phẩm
  $scope.Products = [];
  $scope.CartItems = [];
  $scope.DiscountedProducts = []; // Mảng để chứa sản phẩm đang giảm giá
  $scope.NewProducts = []; // Mảng để chứa sản phẩm mới

  // Lấy dữ liệu từ hai API và kết hợp chúng
  $scope.getCombinedData = function () {
    var productsApi = $http.get('http://localhost:8080/beesixcake/api/orderdetail');
    var cartItemsApi = $http.get('http://localhost:8080/beesixcake/api/productdetail');

    // Sử dụng Promise.all để gọi đồng thời và kết hợp dữ liệu
    Promise.all([productsApi, cartItemsApi])
    .then(function (responses) {
        var productsData = responses[0].data.map(item => {
            var originalPrice = item.productdetail.unitprice; // Lưu giá gốc
            var discountAmount = item.order.discount ? item.order.discount.discountpercentage : 0;
            var discountedPrice = originalPrice - (originalPrice * (discountAmount / 100)); // Tính giá đã giảm

            return {
                ...item.productdetail.product,
                unitprice: originalPrice,
                discount: discountAmount,
                discountedPrice: discountedPrice, // Thêm giá đã giảm
                img: item.productdetail.product.img,
                category: item.productdetail.product.category ? item.productdetail.product.category.categoryname : 'Chưa xác định',
                isactive: item.productdetail.product.isactive // Thêm thuộc tính isactive
            };
        });

        // Lọc sản phẩm đang giảm giá và có isactive là true
        $scope.DiscountedProducts = productsData.filter(product => product.discount > 0 && product.isactive);
        
        // Lọc sản phẩm mới (giả sử có thuộc tính isNew) và có isactive là true
        $scope.NewProducts = productsData.filter(product =>  product.isactive);
           // Lưu tất cả sản phẩm vào mảng
          // Lưu tất cả sản phẩm vào mảng
        $scope.Products = productsData.filter(product => product.isactive); // Sản phẩm đang hoạt động
        // Cập nhật view
        $scope.$apply(); // Cập nhật view
        
    }).catch(function (error) {
        console.error("Error fetching data:", error);
    });
};

  // Hàm chuyển hướng đến trang chi tiết sản phẩm
  $scope.goToProduct = function (productId) {
    if (productId) {
      // Kiểm tra productId
      var url = "http://127.0.0.1:5500/src/main/resources/templates/assets/chitietsanpham.html?id=" + productId;
      window.location.href = url;
    } else {
      console.log("Product ID is not valid.");
    }
  };

  // Gọi hàm để lấy dữ liệu
  $scope.getCombinedData();
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