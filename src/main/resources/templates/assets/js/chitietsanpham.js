var app = angular.module("myApp", ["ngRoute"]);

const API = "http://localhost:8080/beesixcake/api";

app.controller("ProductDetailController", function ($scope, $http) {
    // Lấy thông tin sản phẩm
    $http.get(`${API}/product/1`).then(function(response) {
        $scope.product = response.data;
    });

    // Lấy thông tin chi tiết sản phẩm
    $http.get(`${API}/productdetail`).then(function(response) {
        // Lọc chi tiết sản phẩm theo ID sản phẩm
        $scope.productDetails = response.data.filter(detail => detail.product.idproduct === 1);

        // Mặc định là kích cỡ M (idsize = 1)
        $scope.selectedSizeDetail = $scope.productDetails.find(detail => detail.size.idsize === 1);
        $scope.selectedSize = $scope.selectedSizeDetail.size.sizename;
        $scope.selectedQuantity = 1; // Số lượng mặc định là 1
    });

    // Hàm để thay đổi kích cỡ khi người dùng click vào nút
    $scope.selectSize = function(sizename) {
        $scope.selectedSize = sizename;
        $scope.selectedSizeDetail = $scope.productDetails.find(detail => detail.size.sizename === sizename);
    };
});


