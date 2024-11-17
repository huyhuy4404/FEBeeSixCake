const allCategory = "http://localhost:8080/beesixcake/api/category";
const categoryApi = "http://localhost:8080/beesixcake/api/category"; // API endpoint

var app = angular.module('myApp', []);

app.controller('CategoryController', function($scope, $http) {
    // Thêm biến để kiểm tra trạng thái thêm/sửa
    $scope.isEditing = false;  // Mặc định là chế độ thêm mới

    // Lấy danh sách loại sản phẩm từ API
    $scope.getCategories = function() {
        $http.get('http://localhost:8080/beesixcake/api/category')
            .then(function(response) {
                $scope.categories = response.data; // Lưu danh sách loại sản phẩm
            }, function(error) {
                console.log('Error fetching categories:', error);
            });
    };

    // Thêm loại sản phẩm mới
    $scope.addCategory = function() {
        var newCategory = {
            categoryname: $scope.selectedCategory.categoryname
        };

        $http.post('http://localhost:8080/beesixcake/api/category', newCategory)
            .then(function(response) {
                alert('Thêm loại sản phẩm thành công!');
                $scope.getCategories(); // Tải lại danh sách sau khi thêm
                $scope.resetForm(); // Làm mới form
                $scope.isEditing = false; // Đặt lại chế độ thêm mới
            }, function(error) {
                console.log('Error adding category:', error);
            });
    };

    // Chỉnh sửa loại sản phẩm
    $scope.editCategory = function() {
        var editedCategory = {
            idcategory: $scope.selectedCategory.idcategory,
            categoryname: $scope.selectedCategory.categoryname
        };

        $http.put('http://localhost:8080/beesixcake/api/category/' + editedCategory.idcategory, editedCategory)
            .then(function(response) {
                alert('Sửa loại sản phẩm thành công!');
                $scope.getCategories(); // Tải lại danh sách sau khi sửa
                $scope.resetForm(); // Làm mới form
                $scope.isEditing = false; // Chuyển về chế độ thêm mới
            }, function(error) {
                console.log('Error editing category:', error);
            });
    };

    // Xóa loại sản phẩm
    $scope.deleteCategory = function(category) {
        if (confirm('Bạn có chắc chắn muốn xóa loại sản phẩm này?')) {
            $http.delete('http://localhost:8080/beesixcake/api/category/' + category.idcategory)
                .then(function(response) {
                    alert('Xóa loại sản phẩm thành công!');
                    $scope.getCategories(); // Tải lại danh sách sau khi xóa
                }, function(error) {
                    console.log('Error deleting category:', error);
                });
        }
    };

    // Đưa dữ liệu sản phẩm vào form để chỉnh sửa
    $scope.goToEdit = function(category) {
        $scope.selectedCategory = angular.copy(category);
        $scope.isEditing = true; // Chuyển sang chế độ chỉnh sửa
    };

    // Làm mới form
    $scope.resetForm = function() {
        $scope.selectedCategory = {}; // Reset form
    };

    // Khởi động: Tải danh sách loại sản phẩm ngay khi trang được tải
    $scope.getCategories();
});
