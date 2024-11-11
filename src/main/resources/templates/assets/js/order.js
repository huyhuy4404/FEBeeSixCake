var app = angular.module("order", ["ngRoute"]);

// Controller cho giỏ hàng
app.controller("CartController", [
  "$scope",
  "$http",
  function ($scope, $http) {
    $scope.products = []; // Dữ liệu giỏ hàng
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

    // Kiểm tra người dùng đã đăng nhập chưa
    if (!loggedInUser) {
      console.log("Bạn cần đăng nhập.");
      return;
    }

    // Lấy idShoppingCart của người dùng
    $http
      .get(
        `http://localhost:8080/beesixcake/api/shoppingcart/account/${loggedInUser.idaccount}`
      )
      .then(function (response) {
        const idShoppingCart = response.data[0].idshoppingcart;
        console.log(idShoppingCart);

        // Lấy các sản phẩm trong giỏ hàng
        $http
          .get(
            `http://localhost:8080/beesixcake/api/cartitems/shoppingcart/${idShoppingCart}`
          )
          .then(function (cartItemsResponse) {
            // Nhóm sản phẩm theo productdetail.idproductdetail
            const groupedProducts = {};

            cartItemsResponse.data.forEach(function (item) {
              const productDetailId = item.productdetail.idproductdetail;
              if (groupedProducts[productDetailId]) {
                groupedProducts[productDetailId].quantity += item.quantity;
                groupedProducts[productDetailId].cartItems.push(item);
              } else {
                groupedProducts[productDetailId] = {
                  id: item.productdetail.product.idproduct,
                  name: item.productdetail.product.productname,
                  price: item.productdetail.unitprice,
                  quantity: item.quantity,
                  image: item.productdetail.product.img,
                  idproductdetail: productDetailId,
                  size: item.productdetail.size,
                  selected: false,
                  idcartitem: item.idcartitem || "Chưa có idcartitem",
                  cartItems: [item],
                };
              }
            });

            // Chuyển groupedProducts thành mảng để hiển thị
            $scope.products = Object.values(groupedProducts);
            $scope.products.forEach((product) => {
              product.cartItems.forEach((cartItem) => {
                const productDetail = cartItem.productdetail;
                console.log(
                  `idcartitem: ${cartItem.idcartitem}, Tên sản phẩm: ${cartItem.productdetail.product.productname}, Sản phẩm này có cùng idproductdetail: ${productDetail.idproductdetail}`
                );
              });
            });
            // Tính tổng giá trị đơn hàng
            $scope.calculateTotal();
          })
          .catch(function (error) {
            console.error("Lỗi khi lấy chi tiết sản phẩm:", error);
          });
      })
      .catch(function (error) {
        console.error("Lỗi khi lấy giỏ hàng:", error);
      });
    $scope.validateQuantity = function (product) {
      if (isNaN(product.quantity) || product.quantity < 1) {
        product.quantity = 1; // Đặt lại giá trị về 1 nếu không hợp lệ
      }
      $scope.calculateTotal(); // Tính lại tổng giỏ hàng
    };
    $scope.increaseQuantity = function (product) {
      product.quantity += 1; // Tăng số lượng lên 1
      $scope.calculateTotal(); // Tính lại tổng tiền
    };

    $scope.decreaseQuantity = function (product) {
      if (product.quantity > 1) {
        product.quantity -= 1; // Giảm số lượng xuống 1 (tối thiểu là 1)
        $scope.calculateTotal(); // Tính lại tổng tiền
      }
    };
    // Tính tổng giá trị giỏ hàng
    $scope.calculateTotal = function () {
      $scope.totalPrice = $scope.products.reduce(function (sum, product) {
        return sum + product.price * product.quantity;
      }, 0);
    };
    $scope.calculateSelectedTotal = function () {
      const selectedTotal = $scope.products.reduce(function (sum, product) {
        if (product.selected) {
          return sum + product.price * product.quantity;
        }
        return sum;
      }, 0);
      return selectedTotal;
    };
    // Đặt hàng
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

    // Biến để lưu sản phẩm cần xóa
    $scope.productToRemove = null;

    // Hiển thị modal và lưu sản phẩm cần xóa
    $scope.removeFromCart = function (product) {
      $scope.productToRemove = product;
      $("#confirmationModal").modal("show"); // Hiển thị modal xác nhận xóa
    };

    // Xác nhận xóa sản phẩm
    $scope.confirmRemove = function () {
      $http
        .delete(
          `http://localhost:8080/beesixcake/api/cartitems/productdetail/${$scope.productToRemove.idproductdetail}`
        )
        .then(function (response) {
          const index = $scope.products.indexOf($scope.productToRemove);
          if (index !== -1) {
            $scope.products.splice(index, 1);
            $scope.calculateTotal(); // Cập nhật tổng tiền
            showMessage("Đã xóa sản phẩm khỏi giỏ hàng.", "success");
          }
          $("#confirmationModal").modal("hide"); // Đóng modal sau khi xóa
        })
        .catch(function (error) {
          console.error("Lỗi khi xóa sản phẩm:", error);
          showMessage("Không thể xóa sản phẩm. Vui lòng thử lại.", "danger");
          $("#confirmationModal").modal("hide"); // Đóng modal khi có lỗi
        });
    };
  },
]);

// Controller cho đăng nhập và đăng xuất
app.controller("CheckLogin", function ($scope, $http, $window, $timeout) {
  $scope.isLoggedIn = false;
  $scope.user = { idaccount: "", password: "" };
  $scope.loginError = "";

  // Kiểm tra người dùng đã đăng nhập chưa
  if (localStorage.getItem("loggedInUser")) {
    $scope.isLoggedIn = true;
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  } else {
    $window.location.href = "login.html"; // Chuyển đến trang đăng nhập nếu chưa đăng nhập
  }

  // Cập nhật giao diện theo trạng thái đăng nhập
  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
  };

  // Đăng nhập
  $scope.login = function () {
    if (!$scope.isLoggedIn) {
      $scope.loginError = ""; // Reset thông báo lỗi

      // Gửi yêu cầu để lấy danh sách tài khoản
      $http
        .get("http://localhost:8080/beesixcake/api/account")
        .then(function (response) {
          $scope.accounts = response.data;
          const foundAccount = $scope.accounts.find(
            (account) =>
              account.idaccount === $scope.user.idaccount &&
              account.password === $scope.user.password
          );

          if (foundAccount) {
            if (foundAccount.admin) {
              $scope.loginError = "Bạn không có quyền truy cập!";
            } else {
              $scope.loginSuccess = "Đăng nhập thành công!";
              localStorage.setItem(
                "loggedInUser",
                JSON.stringify(foundAccount)
              );
              $scope.updateAccountMenu();
              $window.location.href = "index.html"; // Chuyển đến trang chính sau khi đăng nhập thành công
            }
          } else {
            $scope.loginError = "Tên người dùng hoặc mật khẩu không đúng!";
          }
        })
        .catch(function (error) {
          $scope.loginError = "Lỗi khi kết nối đến máy chủ. Vui lòng thử lại.";
          console.error("Error:", error);
        });
    } else {
      alert("Bạn đã đăng nhập rồi.");
    }
  };

  // Đăng xuất
  $scope.logout = function () {
    localStorage.removeItem("loggedInUser");
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
    $window.location.href = "login.html"; // Chuyển về trang đăng nhập sau khi đăng xuất
  };
});
