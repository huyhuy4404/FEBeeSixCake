app.controller('CartController', ['$scope', '$http', function ($scope, $http) {
    $scope.products = [];
    $scope.addresses = [];
    $scope.account = {}; // Thông tin người mua hàng
    $scope.totalPrice = 0;

    // Hàm định dạng tiền tệ
   
    $scope.formatCurrency = function (amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };
    // Lấy thông tin người mua hàng từ API
    $http.get('http://localhost:8080/beesixcake/api/account') // Thay đổi URL cho đúng
        .then(function (response) {
            $scope.account = response.data; // Dữ liệu trả về là đối tượng người mua
        })
        .catch(function (error) {
            console.error('Error fetching buyer info:', error);
        });

    // Lấy dữ liệu từ API sản phẩm
    $http.get('http://localhost:8080/beesixcake/api/productdetail')
        .then(function (response) {
            $scope.products = response.data.map(function (item) {
                return {
                    id: item.product.idproduct, // ID sản phẩm
                    name: item.product.productname, // Tên sản phẩm
                    img: item.product.img, // Hình ảnh sản phẩm
                    categoryName: item.product.category.categoryname, // Tên loại sản phẩm
                    sz: item.size.sizename, // Kích cỡ
                    price: item.unitprice, // Giá sản phẩm
                    quantity: item.quantityinstock, // Số lượng trong kho
                    description: item.product.description // Mô tả sản phẩm
                };
            });
            
            $scope.calculateTotal(); // Tính tổng giá sau khi lấy sản phẩm
        })
        .catch(function (error) {
            console.error('Error fetching product details:', error);
        });

    // Lấy địa chỉ
    $http.get('http://localhost:8080/beesixcake/api/address')
        .then(function (response) {
            $scope.addresses = response.data.map(function (item) {
                return {
                    phone: item.account.phonenumber, // Số điện thoại
                    name: item.account.fullname, // Tên người nhận
                    DC: item.city // Địa chỉ
                };
            });
        })
        .catch(function (error) {
            console.error('Error fetching address details:', error);
        });

    // Hàm tính tổng giá
    $scope.calculateTotal = function () {
        $scope.totalPrice = $scope.products.reduce(function (sum, product) {
            return sum + (product.price * product.quantity); // Tính tổng giá
        }, 0);
        return $scope.totalPrice;
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getCombinedData = function () {
        // Chưa có nội dung, có thể sử dụng để gọi API khác nếu cần
    };

    // Gọi hàm để tính tổng ngay khi khởi động
    $scope.getCombinedData();
}]);