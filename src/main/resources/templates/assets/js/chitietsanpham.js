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

        // Cập nhật đường dẫn ảnh cho từng chi tiết sản phẩm
        $scope.productDetails.forEach((detail) => {
          detail.product.img =
            imageBaseUrl + detail.product.img.split("/").pop();
        });

        // Mặc định là kích cỡ M (idsize = 1), nếu có
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

    // Lấy tất cả sản phẩm để tính số lượng theo từng idcategory
    $http
      .get(`${API}/product`)
      .then(function (response) {
        const products = response.data;

        // Đếm số lượng sản phẩm cho mỗi idcategory và lấy tên category
        $scope.categories = products.reduce((acc, product) => {
          const category = acc.find(
            (cat) => cat.idcategory === product.category.idcategory
          );
          if (category) {
            category.count += 1;
          } else {
            acc.push({
              idcategory: product.category.idcategory,
              categoryname: product.category.categoryname,
              count: 1,
            });
          }
          return acc;
        }, []);
      })
      .catch(function (error) {
        console.error("Error fetching categories:", error);
      });
  } else {
    console.error("Product ID is missing from the URL");
  }

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
      $scope.changePasswordError =
        "Mật khẩu mới và xác nhận mật khẩu không khớp!";
      return;
    }

    // Gửi yêu cầu PUT để cập nhật mật khẩu
    var updatedAccount = {
      ...$scope.loggedInUser,
      password: $scope.user.newPassword, // Cập nhật mật khẩu mới
    };

    $http
      .put(
        "http://localhost:8080/beesixcake/api/account/" +
          updatedAccount.idaccount,
        updatedAccount
      )
      .then(function (response) {
        // Cập nhật thông tin trong localStorage
        localStorage.setItem("loggedInUser", JSON.stringify(updatedAccount));
        $scope.changePasswordSuccess = "Đổi mật khẩu thành công!";
        $scope.loggedInUser.password = $scope.user.newPassword; // Cập nhật mật khẩu trong phiên làm việc
      })
      .catch(function (error) {
        // Xử lý lỗi từ API
        $scope.changePasswordError =
          "Lỗi khi cập nhật mật khẩu. Vui lòng thử lại.";
        console.error("Error:", error);
      });
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
