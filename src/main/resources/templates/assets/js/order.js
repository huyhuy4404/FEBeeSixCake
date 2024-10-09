var app = angular.module("myApp", ["ngRoute"]);
app.controller("CartController", [
  "$scope",
  "$http",
  function ($scope, $http) {
    $scope.products = [];

    // Hàm lấy dữ liệu từ API
    $http
      .get("http://localhost:8080/beesixcake/api/productdetail")
      .then(function (response) {
        // Duyệt qua dữ liệu từ API
        $scope.products = response.data.map(function (item) {
          return {
            id: item.product.idproduct,
            name: item.product.productname,
            sku: "SKU" + item.idproductdetail, // Hoặc cách lấy mã SKU khác
            price: item.unitprice,
            quantity: 1, // Đặt mặc định là 1 hoặc sử dụng item.quantityinstock nếu cần
            image: item.product.img,
            description: item.product.description,
          };
        });
        $scope.calculateTotal();
      })
      .catch(function (error) {
        console.error("Error fetching product details:", error);
      });

    $scope.totalPrice = 0;
    $scope.placeOrder = function () {
      const orderData = {
        products: $scope.products.map((product) => ({
          idproduct: product.id, // ID sản phẩm
          quantity: product.quantity, // Số lượng sản phẩm
        })),
      };

      $http
        .post("http://localhost:8080/beesixcake/api/order", orderData)
        .then(function (response) {
          // Xử lý khi đơn hàng được gửi thành công
          alert("Đơn hàng đã được gửi thành công!");
          $scope.clearCart(); // Xóa giỏ hàng nếu cần
        })
        .catch(function (error) {
          // Xử lý khi có lỗi xảy ra
          console.error("Lỗi khi gửi đơn hàng:", error);
          alert("Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại.");
        });
    };
    $scope.placeOrder = function () {
      const orderData = {
        products: $scope.products.map((product) => ({
          idproduct: product.id, // ID sản phẩm
          quantity: product.quantity, // Số lượng sản phẩm
        })),
      };

      $http
        .post("http://localhost:8080/beesixcake/api/order", orderData)
        .then(function (response) {
          // Xử lý khi đơn hàng được gửi thành công
          alert("Đơn hàng đã được gửi thành công!");
          $scope.clearCart(); // Xóa giỏ hàng nếu cần
        })
        .catch(function (error) {
          // Xử lý khi có lỗi xảy ra
          console.error("Lỗi khi gửi đơn hàng:", error);
          alert("Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại.");
        });
    };
    // Hàm tính tổng giá
    $scope.calculateTotal = function () {
      $scope.totalPrice = $scope.products.reduce(function (sum, product) {
        return sum + product.price * product.quantity;
      }, 0);
      return $scope.totalPrice;
    };

    // Hàm xóa giỏ hàng
    $scope.clearCart = function () {
      $scope.products = [];
      $scope.totalPrice = 0;
    };

    // Hàm xóa một sản phẩm
    $scope.removeFromCart = function (index) {
      $scope.products.splice(index, 1);
      $scope.calculateTotal();
    };

    // Gọi hàm để tính tổng ngay khi khởi động
    $scope.calculateTotal();
  },
]);
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
