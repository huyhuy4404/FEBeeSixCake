var app = angular.module("myApp", []);

app.controller("ProductDetailController", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api";
  const imageBaseUrl = "https://5ck6jg.csb.app/anh/";
  var urlParams = new URLSearchParams(window.location.search);
  var productId = urlParams.get("id");

  // Kiểm tra nếu có productId
  if (productId) {
    // Gọi API để lấy thông tin sản phẩm
    $http
      .get(`${API}/product/${productId}`)
      .then(function (response) {
        $scope.product = response.data;
        $scope.product.img = imageBaseUrl + $scope.product.img.split("/").pop();
      })
      .catch(function (error) {
        console.error("Error fetching product:", error);
      });

    // Gọi API để lấy chi tiết sản phẩm
    $http
      .get(`${API}/productdetail`)
      .then(function (response) {
        $scope.productDetails = response.data.filter(
          (detail) => detail.product.idproduct == productId
        );

        $scope.productDetails.forEach((detail) => {
          detail.product.img =
            imageBaseUrl + detail.product.img.split("/").pop();
        });

        $scope.selectedSizeDetail =
          $scope.productDetails.find((detail) => detail.size.idsize === 1) ||
          $scope.productDetails[0];
        $scope.selectedSize = $scope.selectedSizeDetail.size.sizename;
        $scope.quantity = 1;
        $scope.maxQuantity = $scope.selectedSizeDetail.quantityinstock;
      })
      .catch(function (error) {
        console.error("Error fetching product details:", error);
      });

    // Lấy thông tin giỏ hàng từ API
    $http
      .get(`${API}/shoppingcart`)
      .then(function (response) {
        const shoppingCarts = response.data;
        const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        $scope.currentUserShoppingCart = shoppingCarts.find(
          (cart) => cart.account.idaccount === loggedInUser.idaccount
        );
      })
      .catch(function (error) {
        console.error("Error fetching shopping cart:", error);
      });
  } else {
    console.error("Product ID is missing from the URL");
  }

  // Thêm sản phẩm vào giỏ hàng
  $scope.addToCart = function () {
    if (!$scope.currentUserShoppingCart) {
      alert("Giỏ hàng không tồn tại. Vui lòng đăng nhập lại.");
      return;
    }

    // Kiểm tra số lượng hợp lệ
    if ($scope.quantity < 1 || $scope.quantity > $scope.maxQuantity) {
      alert("Số lượng không hợp lệ!");
      return;
    }

    // Chuẩn bị dữ liệu để gửi lên API
    const cartItem = {
      quantity: $scope.quantity,
      productdetail: {
        idproductdetail: $scope.selectedSizeDetail.idproductdetail,
      },
      shoppingcart: {
        idshoppingcart: $scope.currentUserShoppingCart.idshoppingcart,
      },
    };

    // Gửi yêu cầu POST tới API /cartitems
    $http
      .post(`${API}/cartitems`, cartItem)
      .then(function (response) {
        alert("Thêm sản phẩm vào giỏ hàng thành công!");
      })
      .catch(function (error) {
        console.error("Error adding to cart:", error);
        alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
      });
  };

  // Thay đổi kích cỡ
  $scope.selectSize = function (sizename) {
    $scope.selectedSize = sizename;
    $scope.selectedSizeDetail = $scope.productDetails.find(
      (detail) => detail.size.sizename === sizename
    );
    $scope.maxQuantity = $scope.selectedSizeDetail.quantityinstock || 1;
    $scope.quantity = 1; // Đặt lại số lượng về 1 khi thay đổi kích cỡ
  };

  // Yêu thích (toggle heart icon)
  $scope.isActive = false; // Khởi tạo biến trạng thái
  $scope.toggleHeart = function () {
    $scope.isActive = !$scope.isActive; // Đảo ngược trạng thái khi nhấn nút
  };

  // Giảm số lượng sản phẩm
  $scope.decreaseQuantity = function () {
    if ($scope.quantity > 1) {
      $scope.quantity--;
    }
  };

  // Tăng số lượng sản phẩm
  $scope.increaseQuantity = function () {
    if ($scope.quantity < $scope.maxQuantity) {
      $scope.quantity++;
    }
  };

  // Cập nhật số lượng sản phẩm khi người dùng thay đổi giá trị
  $scope.updateQuantity = function () {
    $scope.quantity = parseInt($scope.quantity);
    if ($scope.quantity > $scope.maxQuantity) {
      $scope.quantity = $scope.maxQuantity;
    } else if ($scope.quantity < 1) {
      $scope.quantity = 1;
    }
  };

  // Hàm chuyển hướng đến trang giỏ hàng
  $scope.goToCart = function (productdetailId) {
    if (productdetailId) {
      const url =
        "http://127.0.0.1:5500/src/main/resources/templates/assets/giohang.html?id=" +
        productdetailId;
      window.location.href = url;
    } else {
      console.log("Product ID is not valid.");
    }
  };
});

app.controller("CheckLogin", function ($scope, $http, $window, $timeout) {
  $scope.isLoggedIn = false;
  $scope.user = {
    idaccount: "",
    password: "",
  };
  $scope.loginError = ""; 

  if (localStorage.getItem("loggedInUser")) {
    $scope.isLoggedIn = true;
    $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
  } else {
    $window.location.href = "login.html"; 
  }

  $scope.updateAccountMenu = function () {
    $scope.isLoggedIn = !!localStorage.getItem("loggedInUser");
  };

  $scope.changePassword = function () {
    $scope.changePasswordError = "";
    $scope.changePasswordSuccess = "";

    if ($scope.user.currentPassword !== $scope.loggedInUser.password) {
      $scope.changePasswordError = "Mật khẩu hiện tại không đúng!";
      return;
    }

    if ($scope.user.newPassword !== $scope.user.confirmPassword) {
      $scope.changePasswordError =
        "Mật khẩu mới và xác nhận mật khẩu không khớp!";
      return;
    }

    var updatedAccount = {
      ...$scope.loggedInUser,
      password: $scope.user.newPassword,
    };

    $http
      .put(
        "http://localhost:8080/beesixcake/api/account/" +
          updatedAccount.idaccount,
        updatedAccount
      )
      .then(function (response) {
        localStorage.setItem("loggedInUser", JSON.stringify(updatedAccount));
        $scope.changePasswordSuccess = "Đổi mật khẩu thành công!";
        $scope.loggedInUser.password = $scope.user.newPassword; 
      })
      .catch(function (error) {
        $scope.changePasswordError =
          "Lỗi khi cập nhật mật khẩu. Vui lòng thử lại.";
        console.error("Error:", error);
      });
  };

  $scope.login = function () {
    if (!$scope.isLoggedIn) {
      $scope.loginError = ""; 

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
              $scope.loginError = "Bạn không có quyền truy cập!";
            } else {
              $scope.loginSuccess = "Đăng nhập thành công!";
              localStorage.setItem(
                "loggedInUser",
                JSON.stringify(foundAccount)
              );
              $scope.updateAccountMenu();
              $window.location.href = "index.html";
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

  $scope.logout = function () {
    localStorage.removeItem("loggedInUser");
    $scope.isLoggedIn = false;
    $scope.loggedInUser = null;
    $window.location.href = "login.html"; 
  };
});
