var app = angular.module("myApp", ["ngRoute"]);

const API = "http://localhost:8080/beesixcake/api";

var urlParams = new URLSearchParams(window.location.search);
var productId = urlParams.get('id'); // Lấy giá trị của tham số 'id'

app.controller("ProductDetailController", function ($scope, $http) {
    // Kiểm tra nếu có productId
    if (productId) {
        // Gọi API để lấy thông tin sản phẩm theo productId
        $http.get(`${API}/product/${productId}`).then(function(response) {
            $scope.product = response.data;
        }).catch(function (error) {
            console.log('Error fetching product details:', error);
        });

        // Gọi API để lấy chi tiết sản phẩm theo productId
        $http.get(`${API}/productdetail`).then(function(response) {
            // Lọc chi tiết sản phẩm theo ID sản phẩm
            $scope.productDetails = response.data.filter(detail => detail.product.idproduct == productId);

            // Mặc định là kích cỡ M (idsize = 1), nếu có
            $scope.selectedSizeDetail = $scope.productDetails.find(detail => detail.size.idsize === 1) || $scope.productDetails[0]; // Lấy chi tiết đầu tiên nếu không có size M
            $scope.selectedSize = $scope.selectedSizeDetail.size.sizename;
            $scope.selectedQuantity = 1; // Số lượng mặc định là 1
        }).catch(function (error) {
            console.log('Error fetching product details:', error);
        });
    } else {
        console.error('Product ID is missing from the URL');
    }

    // Hàm để thay đổi kích cỡ khi người dùng click vào nút
    $scope.selectSize = function(sizename) {
        $scope.selectedSize = sizename;
        $scope.selectedSizeDetail = $scope.productDetails.find(detail => detail.size.sizename === sizename);
    };

    $scope.goToProduct = function (productId) {
        window.location.href = "http://127.0.0.1:5500/src/main/resources/templates/assets/chitietsanpham.html?id=" + productId;
    };

});
