app.controller('CartController', ['$scope', '$http', function($scope, $http) {
    $scope.products = [];
    
    // Hàm lấy dữ liệu từ API
    $http.get('http://localhost:8080/beesixcake/api/productdetail')
        .then(function(response) {
            // Duyệt qua dữ liệu từ API
            $scope.products = response.data.map(function(item) {
                return {
                    id: item.product.idproduct,
                    name: item.product.productname,
                    sku: "SKU" + item.idproductdetail, // Hoặc cách lấy mã SKU khác
                    price: item.unitprice,
                    quantity: 1, // Đặt mặc định là 1 hoặc sử dụng item.quantityinstock nếu cần
                    image: "assets/img/" + item.product.im,
                    description: item.product.description
                };
            });
            $scope.calculateTotal();
        })
        .catch(function(error) {
            console.error('Error fetching product details:', error);
        });

    $scope.totalPrice = 0;
        $scope.placeOrder = function() {
        const orderData = {
            products: $scope.products.map(product => ({
                idproduct: product.id, // ID sản phẩm
                quantity: product.quantity // Số lượng sản phẩm
            }))
        };

        $http.post('http://localhost:8080/beesixcake/api/order', orderData)
            .then(function(response) {
                // Xử lý khi đơn hàng được gửi thành công
                alert('Đơn hàng đã được gửi thành công!');
                $scope.clearCart(); // Xóa giỏ hàng nếu cần
            })
            .catch(function(error) {
                // Xử lý khi có lỗi xảy ra
                console.error('Lỗi khi gửi đơn hàng:', error);
                alert('Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại.');
            });
    };
    $scope.placeOrder = function() {
        const orderData = {
            products: $scope.products.map(product => ({
                idproduct: product.id, // ID sản phẩm
                quantity: product.quantity // Số lượng sản phẩm
            }))
        };

        $http.post('http://localhost:8080/beesixcake/api/order', orderData)
            .then(function(response) {
                // Xử lý khi đơn hàng được gửi thành công
                alert('Đơn hàng đã được gửi thành công!');
                $scope.clearCart(); // Xóa giỏ hàng nếu cần
            })
            .catch(function(error) {
                // Xử lý khi có lỗi xảy ra
                console.error('Lỗi khi gửi đơn hàng:', error);
                alert('Có lỗi xảy ra khi gửi đơn hàng. Vui lòng thử lại.');
            });
    };
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
