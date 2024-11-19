var app = angular.module("myApp", []);

app.controller("ProductDetailController", function ($scope, $http) {
  const API = "http://localhost:8080/beesixcake/api";
  const imageBaseUrl = "https://5ck6jg.csb.app/anh/";
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  // Khởi tạo biến
  $scope.product = {};
  $scope.productDetails = [];
  $scope.categories = [];
  $scope.selectedSizeDetail = null;
  $scope.quantity = 1;
  $scope.maxQuantity = 1;
  $scope.favoriteCount = 0;
  $scope.isActive = false;
  $scope.currentFavoriteId = null;
  $scope.loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")) || null;

  if (!productId) {
    console.error("Product ID is missing from the URL");
    return;
  }

  // **1. Lấy thông tin sản phẩm**
  const fetchProduct = () => {
    $http
      .get(`${API}/product/${productId}`)
      .then((response) => {
        $scope.product = response.data;
        $scope.product.img = imageBaseUrl + $scope.product.img.split("/").pop();
      })
      .catch((error) => {
        console.error("Error fetching product:", error);
      });
  };

  // **2. Lấy chi tiết sản phẩm**
  const fetchProductDetails = () => {
    $http
      .get(`${API}/productdetail`)
      .then((response) => {
        $scope.productDetails = response.data.filter(
          (detail) => detail.product.idproduct == productId
        );

        if ($scope.productDetails.length > 0) {
          $scope.productDetails.forEach((detail) => {
            detail.product.img =
              imageBaseUrl + detail.product.img.split("/").pop();
          });

          $scope.selectedSizeDetail =
            $scope.productDetails.find((detail) => detail.size.idsize === 1) ||
            $scope.productDetails[0];
          $scope.selectedSize = $scope.selectedSizeDetail.size.sizename;
          $scope.maxQuantity = $scope.selectedSizeDetail.quantityinstock;
        } else {
          console.warn("No product details found.");
        }
      })
      .catch((error) => {
        console.error("Error fetching product details:", error);
      });
  };

  // **3. Lấy thông tin yêu thích**
  const fetchFavoriteData = () => {
    if (!$scope.loggedInUser) return;

    $http
      .get(`${API}/favorites`)
      .then((response) => {
        const favorites = response.data;

        const productFavorites = favorites.filter(
          (fav) => fav.product.idproduct == productId
        );
        $scope.favoriteCount = productFavorites.length;

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
      .catch((error) => {
        console.error("Error fetching favorites:", error);
      });
  };

  // **4. Thêm vào giỏ hàng**
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
      .then(() => {
        alert("Thêm sản phẩm vào giỏ hàng thành công!");
      })
      .catch((error) => {
        console.error("Error adding to cart:", error);
        alert("Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.");
      });
  };

  // **5. Lấy danh mục sản phẩm**
  const fetchCategories = () => {
    $http
      .get(`${API}/category`)
      .then((response) => {
        $scope.categories = response.data;

        $scope.categories.forEach((category) => {
          category.count = 0; // Khởi tạo count là 0
        });

        $http
          .get(`${API}/product`)
          .then((productResponse) => {
            const products = productResponse.data;

            products.forEach((product) => {
              const category = $scope.categories.find(
                (cat) => cat.idcategory === product.category.idcategory
              );
              if (category) category.count++;
            });
          })
          .catch((error) => {
            console.error("Error fetching products:", error);
          });
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
      });
  };

  // **6. Thay đổi kích cỡ**
  $scope.selectSize = (sizename) => {
    $scope.selectedSize = sizename;
    $scope.selectedSizeDetail = $scope.productDetails.find(
      (detail) => detail.size.sizename === sizename
    );
    $scope.maxQuantity = $scope.selectedSizeDetail.quantityinstock || 1;
    $scope.quantity = 1;
  };

  // **7. Giảm/Tăng số lượng**
  $scope.decreaseQuantity = () => {
    if ($scope.quantity > 1) $scope.quantity--;
  };

  $scope.increaseQuantity = () => {
    if ($scope.quantity < $scope.maxQuantity) $scope.quantity++;
  };

  // **8. Yêu thích sản phẩm**
  $scope.toggleHeart = () => {
    if (!$scope.loggedInUser) {
      alert("Vui lòng đăng nhập để sử dụng chức năng yêu thích.");
      return;
    }

    if ($scope.isActive) {
      $http
        .delete(`${API}/favorites/${$scope.currentFavoriteId}`)
        .then(() => {
          $scope.isActive = false;
          $scope.currentFavoriteId = null;
          fetchFavoriteData();
        })
        .catch((error) => {
          console.error("Error deleting favorite:", error);
          alert("Lỗi khi xóa yêu thích. Vui lòng thử lại.");
        });
    } else {
      const newFavorite = {
        account: { idaccount: $scope.loggedInUser.idaccount },
        product: { idproduct: productId },
      };

      $http
        .post(`${API}/favorites`, newFavorite)
        .then((response) => {
          $scope.isActive = true;
          $scope.currentFavoriteId = response.data.idfavorite;
          fetchFavoriteData();
        })
        .catch((error) => {
          console.error("Error adding favorite:", error);
          alert("Lỗi khi thêm yêu thích. Vui lòng thử lại.");
        });
    }
  };

  // **Gọi tất cả dữ liệu khi khởi tạo**
  fetchProduct();
  fetchProductDetails();
  fetchFavoriteData();
  fetchCategories();
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

