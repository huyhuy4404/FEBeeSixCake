var app = angular.module('myApp', []);

app.controller('discountsController', function ($scope, $http) {
    // Khởi tạo mảng để chứa sản phẩm
    $scope.Products = [];
    $scope.CartItems = [];

    // Lấy dữ liệu từ hai API và kết hợp chúng
    $scope.getCombinedData = function () {
        var productsApi = $http.get('http://localhost:8080/beesixcake/api/product');
        var cartItemsApi = $http.get('http://localhost:8080/beesixcake/api/productdetail');

        // Sử dụng Promise.all để gọi đồng thời và kết hợp dữ liệu
        Promise.all([productsApi, cartItemsApi])
            .then(function (responses) {
                var productsData = responses[0].data.map(item => ({ ...item, source: 'product' }));
                var cartItemsData = responses[1].data.map(item => ({ ...item, source: 'cart' }));
                
                // Kết hợp dữ liệu vào một mảng
                $scope.Products = productsData.concat(cartItemsData);
                $scope.$apply(); // Cập nhật view
            }, function (error) {
                console.log('Error fetching data:', error);
            });
    };

    // Hàm chuyển hướng đến trang chi tiết sản phẩm
    $scope.goToProduct = function (productId) {
        if (productId) { // Kiểm tra productId
            var url = "http://127.0.0.1:5500/src/main/resources/templates/assets/chitietsanpham.html?id=" + productId;
            window.location.href = url;
        } else {
            console.log("Product ID is not valid.");
        }
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getCombinedData();
});
