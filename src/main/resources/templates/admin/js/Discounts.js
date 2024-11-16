var app = angular.module('myApp', []);

app.controller('discountsController', function($scope, $http) {
    // Lấy danh sách loại sản phẩm từ API
    $scope.getDiscounts = function() {
        $http.get('http://localhost:8080/beesixcake/api/discount')
            .then(function(response) {
                $scope.Discounts = response.data; // Lưu danh sách loại sản phẩm
            }, function(error) {
                console.log('Error fetching categories:', error);
            });
    };

    // Hàm kiểm tra và cập nhật phần trăm giảm giá
    $scope.updateDiscountPercentage = function() {
        var lowestPrice = parseFloat($scope.selecteddiscount.lowestprice); // Chuyển đổi thành số
        if (lowestPrice >= 30000) {
            $scope.selecteddiscount.discountpercentage = 5; // Đặt phần trăm giảm giá là 5%
        } else if (lowestPrice < 30 && $scope.selecteddiscount.discountpercentage !== null) {
            // Nếu giá trị dưới  30,000 và phần trăm giảm giá đã được xác định trước đó
            // Giữ nguyên giá trị hiện tại của phần trăm giảm giá
            $scope.selecteddiscount.discountpercentage = $scope.selecteddiscount.discountpercentage; 
        }
    };

    // Cập nhật khi người dùng thay đổi mức giá tối thiểu
    $scope.$watch('selecteddiscount.lowestprice', function(newValue) {
        $scope.updateDiscountPercentage();
    });

    // Thêm loại sản phẩm mới
    $scope.adddiscount = function() {
        var newdiscount = {
            discountcode: $scope.selecteddiscount.discountcode,
            discountpercentage: $scope.selecteddiscount.discountpercentage,
            startdate: $scope.selecteddiscount.startdate,
            enddate: $scope.selecteddiscount.enddate,
            lowestprice: parseFloat($scope.selecteddiscount.lowestprice) || 0 // Chuyển đổi thành số
        };

        $http.post('http://localhost:8080/beesixcake/api/discount', newdiscount)
            .then(function(response) {
                alert('Thêm khuyến mãi thành công!');
                $scope.getDiscounts(); // Tải lại danh sách sau khi thêm
                $scope.resetForm(); // Làm mới form
            }, function(error) {
                console.log('Error adding discount:', error);
            });
    };

    // Chỉnh sửa loại sản phẩm
    $scope.editdiscount = function() {
        var editeddiscount = {
            iddiscount: $scope.selecteddiscount.iddiscount,
            discountcode: $scope.selecteddiscount.discountcode,
            discountpercentage: $scope.selecteddiscount.discountpercentage,
            startdate: $scope.selecteddiscount.startdate,
            enddate: $scope.selecteddiscount.enddate,
            lowestprice: parseFloat($scope.selecteddiscount.lowestprice) || 0 // Chuyển đổi thành số
        };

        $http.put('http://localhost:8080/beesixcake/api/discount/' + editeddiscount.iddiscount, editeddiscount)
            .then(function(response) {
                alert('Sửa khuyến mãi thành công!');
                $scope.getDiscounts(); // Tải lại danh sách sau khi sửa
                $scope.resetForm(); // Làm mới form
            }, function(error) {
                console.log('Error editing category:', error);
            });
    };

    // Xóa khuyến mãi
    $scope.deletediscount = function(discount) {
        if (confirm('Bạn có chắc chắn muốn xóa khuyến mãi này?')) {
            $http.delete('http://localhost:8080/beesixcake/api/discount/' + discount.iddiscount)
                .then(function(response) {
                    alert('Xóa khuyến mãi thành công!');
                    $scope.getDiscounts(); // Tải lại danh sách sau khi xóa
                }, function(error) {
                    console.log('Error deleting category:', error);
                });
        }
    };
 // Hàm định dạng tiền tệ
 $scope.formatCurrency = function(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};
    // Chuyển dữ liệu khuyến mãi vào form để chỉnh sửa
  // Chuyển dữ liệu khuyến mãi vào form để chỉnh sửa
$scope.goToEdit = function(discount) {
    $scope.selecteddiscount = angular.copy(discount);
    // Chuyển đổi các trường ngày sang đối tượng Date
    if (discount.startdate) {
        $scope.selecteddiscount.startdate = new Date(discount.startdate);
    }
    if (discount.enddate) {
        $scope.selecteddiscount.enddate = new Date(discount.enddate);
    }
};

    // Làm mới form
    $scope.resetForm = function() {
        $scope.selecteddiscount = {};
    };

    // Gọi hàm để lấy dữ liệu
    $scope.getDiscounts();
});