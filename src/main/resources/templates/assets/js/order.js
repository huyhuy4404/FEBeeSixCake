var app = angular.module("order", ["ngRoute"]);

app.controller("CartController", [
  "$scope",
  "$http",
  function ($scope, $http) {
    $scope.products = [];

    // Hàm lấy dữ liệu từ API
    $http
      .get("http://localhost:8080/beesixcake/api/cartitems/shoppingcart/1")
      .then(function (response) {
        // Duyệt qua dữ liệu từ API và nhóm sản phẩm theo productdetail.idproductdetail
        const groupedProducts = {};

        response.data.forEach(function (item) {
          const productDetailId = item.productdetail.idproductdetail;
          if (groupedProducts[productDetailId]) {
            // Nếu sản phẩm đã tồn tại trong nhóm, cộng thêm số lượng
            groupedProducts[productDetailId].quantity += item.quantity;
          } else {
            // Nếu chưa tồn tại trong nhóm, thêm mới
            groupedProducts[productDetailId] = {
              id: item.productdetail.product.idproduct,
              name: item.productdetail.product.productname,
              price: item.productdetail.unitprice,
              quantity: item.quantity,
              image: item.productdetail.product.img,
              idproductdetail: productDetailId,
            };
          }
        });

        // Chuyển đổi groupedProducts thành mảng để dễ dàng hiển thị
        $scope.products = Object.values(groupedProducts);

        // Tính tổng giá
        $scope.calculateTotal();
      })
      .catch(function (error) {
        console.error("Error fetching product details:", error);
      });

    // Hàm tính tổng giá
    $scope.calculateTotal = function () {
      $scope.totalPrice = $scope.products.reduce(function (sum, product) {
        return sum + product.price * product.quantity;
      }, 0);
    };

    // Hàm gửi đơn hàng
    $scope.placeOrder = function () {
      const orderData = {
        products: $scope.products.map((product) => ({
          idproduct: product.id,
          quantity: product.quantity,
        })),
      };

      $http
        .post("http://localhost:8080/beesixcake/api/order", orderData)
        .then(function (response) {
          alert("Đơn hàng đã được gửi thành công!");
          $scope.clearCart(); // Xóa giỏ hàng sau khi đặt hàng
        })
        .catch(function (error) {
          console.error("Lỗi khi gửi đơn hàng:", error);
          alert("Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại.");
        });
    };

    $scope.productToRemove = null; // Biến lưu trữ sản phẩm cần xóa

    // Hàm hiển thị modal và lưu sản phẩm cần xóa
    $scope.removeFromCart = function (product) {
      $scope.productToRemove = product;
      // Hiển thị modal
      $("#confirmationModal").modal("show");
    };

    // Hàm xử lý xóa sản phẩm sau khi xác nhận
    $scope.confirmRemove = function () {
      // Gửi yêu cầu xóa sản phẩm từ giỏ hàng
      $http
        .delete(
          `http://localhost:8080/beesixcake/api/cartitems/productdetail/${$scope.productToRemove.idproductdetail}`
        )
        .then(function (response) {
          const index = $scope.products.indexOf($scope.productToRemove);
          if (index !== -1) {
            $scope.products.splice(index, 1);
            $scope.calculateTotal(); // Cập nhật tổng tiền sau khi xóa
            showMessage("Đã xóa sản phẩm khỏi giỏ hàng.", "success");
          }
          // Đóng modal tự động sau khi xóa
          $("#confirmationModal").modal("hide");
        })
        .catch(function (error) {
          console.error("Error deleting product from cart:", error);
          showMessage("Không thể xóa sản phẩm. Vui lòng thử lại.", "danger");
          // Đóng modal tự động sau khi có lỗi
          $("#confirmationModal").modal("hide");
        });
    };
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
