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
        // Đưa dữ liệu sản phẩm vào form để chỉnh sửa
// // Thêm loại sản phẩm mới
    $scope.adddiscount = function() {
        var newdiscount = {
            discountcode: $scope.selecteddiscount.discountcode,
            discountpercentage: $scope.selecteddiscount.discountpercentage,
            startdate: $scope.selecteddiscount.startdate,
            enddate: $scope.selecteddiscount.enddate
        };

        $http.post('http://localhost:8080/beesixcake/api/discount', newdiscount)
            .then(function(response) {
                alert('Thêm loại sản phẩm thành công!');
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
            enddate: $scope.selecteddiscount.enddate
        };

        $http.put('http://localhost:8080/beesixcake/api/discount/' + editeddiscount.iddiscount, editeddiscount)
            .then(function(response) {
                alert('Sửa loại sản phẩm thành công!');
                $scope.getDiscounts(); // Tải lại danh sách sau khi sửa
                $scope.resetForm(); // Làm mới form
            }, function(error) {
                console.log('Error editing category:', error);
            });
    };

    $scope.deletediscount = function(discount) {
        if (confirm('Bạn có chắc chắn muốn xóa loại sản phẩm này?')) {
            $http.delete('http://localhost:8080/beesixcake/api/discount/' + discount.iddiscount)
                .then(function(response) {
                    alert('Xóa loại sản phẩm thành công!');
                    $scope.getDiscounts(); // Tải lại danh sách sau khi xóa
                }, function(error) {
                    console.log('Error deleting category:', error);
                });
        }
    };
    $scope.goToEdit = function(discount) {
        $scope.selecteddiscount = angular.copy(discount);
    };
    $scope.resetForm = function() {
        $scope.selecteddiscount = {};
    };
    $scope.getDiscounts();
});