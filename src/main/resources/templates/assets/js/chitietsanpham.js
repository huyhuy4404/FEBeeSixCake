var app = angular.module("myApp", []);

app.controller("ProductDetailController", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api";
  const imageBaseUrl = "https://5ck6jg.csb.app/anh/";
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  $scope.favoriteCount = 0; // Khởi tạo số lượng yêu thích
  $scope.isActive = false; // Trạng thái yêu thích
  $scope.currentFavoriteId = null; // ID yêu thích hiện tại
  $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")); // Lấy thông tin tài khoản đăng nhập

  if (!productId) {
    console.error("Product ID is missing from the URL");
    return;
  }

  // **1. Lấy thông tin sản phẩm**
  $http
    .get(`${API}/product/${productId}`)
    .then((response) => {
      $scope.product = response.data;
      $scope.product.img = imageBaseUrl + $scope.product.img.split("/").pop();
    })
    .catch((error) => console.error("Error fetching product:", error));

  // **2. Lấy số lượng yêu thích và kiểm tra trạng thái yêu thích**
  const fetchFavoriteData = () => {
    if (!$scope.loggedInUser) return; // Nếu chưa đăng nhập, không cần kiểm tra

    $http
      .get(`${API}/favorites`)
      .then((response) => {
        const favorites = response.data;

        // Đếm số lượng yêu thích cho sản phẩm hiện tại
        const productFavorites = favorites.filter(
          (fav) => fav.product.idproduct == productId
        );
        $scope.favoriteCount = productFavorites.length;

        // Kiểm tra xem người dùng hiện tại đã thích sản phẩm chưa
        const userFavorite = productFavorites.find(
          (fav) => fav.account.idaccount === $scope.loggedInUser.idaccount
        );

        if (userFavorite) {
          $scope.isActive = true;
          $scope.currentFavoriteId = userFavorite.idfavorite;
        } else {
          $scope.isActive = false;
          $scope.currentFavoriteId = null;
        }
      })
      .catch((error) => console.error("Error fetching favorite data:", error));
  };

  // Gọi hàm khi khởi tạo
  fetchFavoriteData();

  // **3. Thay đổi trạng thái yêu thích**
  $scope.toggleHeart = () => {
    if (!$scope.loggedInUser) {
      alert("Vui lòng đăng nhập để sử dụng chức năng yêu thích.");
      return;
    }

    if ($scope.isActive) {
      // Nếu đã thích, gửi yêu cầu DELETE
      $http
        .delete(`${API}/favorites/${$scope.currentFavoriteId}`)
        .then(() => {
          $scope.isActive = false;
          $scope.currentFavoriteId = null;
          fetchFavoriteData(); // Cập nhật lại số lượng yêu thích
          
        })
        .catch((error) => {
          console.error("Error deleting favorite:", error);
          alert("Lỗi khi xóa yêu thích. Vui lòng thử lại.");
        });
    } else {
      // Nếu chưa thích, gửi yêu cầu POST
      const newFavorite = {
        account: { idaccount: $scope.loggedInUser.idaccount },
        product: { idproduct: productId },
      };

      $http
        .post(`${API}/favorites`, newFavorite)
        .then((response) => {
          $scope.isActive = true;
          $scope.currentFavoriteId = response.data.idfavorite;
          fetchFavoriteData(); // Cập nhật lại số lượng yêu thích
          
        })
        .catch((error) => {
          console.error("Error adding favorite:", error);
          alert("Lỗi khi thêm yêu thích. Vui lòng thử lại.");
        });
    }
  };

  // **4. Các hàm khác liên quan đến sản phẩm**
  $scope.selectSize = (sizename) => {
    $scope.selectedSize = sizename;
    $scope.selectedSizeDetail = $scope.productDetails.find(
      (detail) => detail.size.sizename === sizename
    );
    $scope.maxQuantity = $scope.selectedSizeDetail.quantityinstock || 1;
    $scope.quantity = 1; // Đặt lại số lượng về 1 khi thay đổi kích cỡ
  };

  $scope.decreaseQuantity = () => {
    if ($scope.quantity > 1) $scope.quantity--;
  };

  $scope.increaseQuantity = () => {
    if ($scope.quantity < $scope.maxQuantity) $scope.quantity++;
  };

  $scope.updateQuantity = () => {
    $scope.quantity = parseInt($scope.quantity);
    if ($scope.quantity > $scope.maxQuantity) {
      $scope.quantity = $scope.maxQuantity;
    } else if ($scope.quantity < 1) {
      $scope.quantity = 1;
    }
  };

  $scope.addToCart = () => {
    if (!$scope.loggedInUser) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }

    if ($scope.quantity < 1 || $scope.quantity > $scope.maxQuantity) {
      alert("Số lượng không hợp lệ!");
      return;
    }

    const cartItem = {
      quantity: $scope.quantity,
      productdetail: {
        idproductdetail: $scope.selectedSizeDetail.idproductdetail,
      },
      shoppingcart: {
        idshoppingcart: $scope.loggedInUser.idshoppingcart,
      },
    };

    $http
      .post(`${API}/cartitems`, cartItem)
      .then(() => alert("Thêm sản phẩm vào giỏ hàng thành công!"))
      .catch((error) => {
        console.error("Error adding to cart:", error);
        alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
      });
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

