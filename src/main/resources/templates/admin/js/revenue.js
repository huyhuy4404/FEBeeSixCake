var app = angular.module('myApp', []);
app.controller('discountsController', function ($scope, $http) {
    $scope.orderdetai = [];
    $scope.filteredOrderDetails = []; // Biến để lưu dữ liệu đã lọc
    $scope.searchYear = ""; // Biến để lưu giá trị tìm kiếm

    // Hàm lấy dữ liệu từ API
    $scope.getDiscounts = function () {
        $http.get('http://localhost:8080/beesixcake/api/orderdetail')
            .then(function (response) {
                console.log(response.data); // Kiểm tra dữ liệu trả về
                $scope.orderdetai = response.data.map(function (item) {
                    var orderDate = new Date(item.order.orderdate);
                    return {
                        id: orderDate.getFullYear(), // Lấy năm từ orderdate
                        name: item.productdetail.product.productname,
                        categoryName: item.productdetail.product.category.categoryname,
                        quantity: item.productdetail.quantityinstock,
                        unitprice: item.productdetail.unitprice
                    };
                });
                $scope.filteredOrderDetails = $scope.orderdetai; // Khởi tạo dữ liệu đã lọc
                console.log($scope.orderdetai); // Kiểm tra dữ liệu đã chỉnh sửa
            })
            .catch(function (error) {
                console.error('Error fetching product details:', error);
            });
    };

    // Hàm kiểm tra xem mục có khớp với giá trị tìm kiếm không
    $scope.isMatched = function (item) {
        if (!$scope.searchYear) {
            return true; // Nếu không có tìm kiếm, hiển thị tất cả
        }
        const matched = item.id.toString().includes($scope.searchYear);
        console.log(`Kiểm tra ${item.id}: ${matched}`); // Kiểm tra kết quả
        return matched; // Kiểm tra khớp với năm
    };

    // Hàm lọc dữ liệu theo năm
    $scope.filterData = function () {
        if (!$scope.searchYear) {
            $scope.filteredOrderDetails = $scope.orderdetai; // Hiển thị tất cả nếu không có tìm kiếm
        } else {
            $scope.filteredOrderDetails = $scope.orderdetai.filter(function (item) {
                return item.id.toString().includes($scope.searchYear); // Tìm kiếm theo năm
            });
        }
        console.log($scope.filteredOrderDetails); // Kiểm tra kết quả lọc
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getDiscounts();
});