var app = angular.module('myApp', []);

app.controller('CartController', ['$scope', '$http', function($scope, $http) {
    $scope.products = [
        {
            id: 1,
            name: "Sản phẩm 1",
            sku: "SKU001",
            price: 500000,
            quantity: 1,
            image: "images/product1.jpg" // Thay đổi đường dẫn hình ảnh
        },
        {
            id: 2,
            name: "Sản phẩm 2",
            sku: "SKU002",
            price: 300000,
            quantity: 1,
            image: "images/product2.jpg" // Thay đổi đường dẫn hình ảnh
        }
    ];
    
    $scope.totalPrice = 0;

    // Hàm tính tổng giá
    $scope.calculateTotal = function() {
        $scope.totalPrice = $scope.products.reduce(function(sum, product) {
            return sum + (product.price * product.quantity);
        }, 0);
        return $scope.totalPrice;
    };

    // Hàm xóa giỏ hàng
    $scope.clearCart = function() {
        $scope.products = [];
        $scope.totalPrice = 0;
    };

    // Hàm xóa một sản phẩm
    $scope.removeFromCart = function(index) {
        $scope.products.splice(index, 1);
        $scope.calculateTotal();
    };

    // Gọi hàm để tính tổng ngay khi khởi động
    $scope.calculateTotal();
}]);
