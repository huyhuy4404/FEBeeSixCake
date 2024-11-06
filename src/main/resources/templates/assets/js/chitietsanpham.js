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
        $scope.selectedQuantity = 1;
      })
      .catch(function (error) {
        console.error("Error fetching product details:", error);
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
  };

  //yeuthich
  $scope.isActive = false; // Khởi tạo biến trạng thái
  $scope.toggleHeart = function () {
    $scope.isActive = !$scope.isActive; // Đảo ngược trạng thái khi nhấn nút
  };
});
