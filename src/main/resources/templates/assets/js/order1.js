app.controller('CartController', ['$scope', '$http', function ($scope, $http) {
    $scope.products = [];
    $scope.addresses = [];
    $scope.account = {}; // Thêm biến để chứa thông tin người mua hàng
    $scope.totalPrice = 0;

    // Lấy thông tin người mua hàng từ API (ví dụ)
    $http.get('http://localhost:8080/beesixcake/api/account') // Thay đổi URL cho đúng
        .then(function (response) {
            $scope.account = response.data; // Giả sử dữ liệu trả về là đối tượng người mua
        })
        .catch(function (error) {
            console.error('Error fetching buyer info:', error);
        });

    // Lấy dữ liệu từ API sản phẩm
    $http.get('http://localhost:8080/beesixcake/api/productdetail')
        .then(function (response) {
            $scope.products = response.data.map(function (item) {
                return {
                    id: item.product.categoryname,
                    name: item.product.productname,
                    img: item.product.img,
                    categoryName: item.product.category.categoryname,
                    sz: item.size.sizename,
                    price: item.unitprice,
                    quantity: item.quantityinstock,
                    description: item.product.description
                };
            });
            $scope.calculateTotal();
        })
        .catch(function (error) {
            console.error('Error fetching product details:', error);
        });

    // Lấy địa chỉ
    $http.get('http://localhost:8080/beesixcake/api/address')
        .then(function (response) {
            $scope.addresses = response.data.map(function (item) {
                return {
                    phone: item.account.phonenumber,
                    name: item.account.fullname,
                    DC: item.city
                };
            });
        })
        .catch(function (error) {
            console.error('Error fetching address details:', error);
        });

    // Hàm tính tổng giá
    $scope.calculateTotal = function () {
        $scope.totalPrice = $scope.products.reduce(function (sum, product) {
            return sum + (product.price * product.quantity);
        }, 0);
        return $scope.totalPrice;
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getCombinedData = function () {
        // ...
    };

    // Gọi hàm để tính tổng ngay khi khởi động
    $scope.getCombinedData();
}]);