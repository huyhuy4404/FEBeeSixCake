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
});
