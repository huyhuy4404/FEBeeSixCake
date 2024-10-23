var app = angular.module('myApp', []);

app.controller('SizeController', function($scope, $http) {
    $scope.Sizes = [];  // Danh sách kích thước
    $scope.selectedSize = {};  // Kích thước đang chọn
    $scope.isEditMode = false;
    $scope.message = '';
    $scope.messageType = '';

    // Hàm load danh sách kích thước từ API
    $scope.loadSizes = function() {
        // Xóa thông tin cũ trong form
        $scope.selectedSize = {};  // Đặt lại form kích thước
        $scope.isEditMode = false; // Thoát khỏi chế độ chỉnh sửa (nếu đang chỉnh sửa)
        $scope.message = '';       // Xóa thông báo trước đó (nếu có)
    
        // Gọi API để lấy danh sách kích thước
        $http.get('http://localhost:8080/beesixcake/api/size')
            .then(function(response) {
                $scope.Sizes = response.data;  // Cập nhật danh sách kích thước
                $scope.messageType = 'success';
            })
            .catch(function(error) {
                $scope.message = 'Có lỗi xảy ra khi làm mới danh sách.';
                $scope.messageType = 'error';
            });
    };
    
    
    
    

    // Hàm thêm kích thước mới
    $scope.addSize = function() {
        $http.post('http://localhost:8080/beesixcake/api/size', $scope.selectedSize)
            .then(function(response) {
                $scope.message = 'Thêm kích thước thành công!';
                $scope.messageType = 'success';
                
                // Thêm kích thước mới vào đầu danh sách hiện tại
                $scope.Sizes.unshift(response.data);  // response.data chứa kích thước mới được thêm
                
                $scope.selectedSize = {};  // Reset form
            })
            .catch(function(error) {
                $scope.message = 'Có lỗi xảy ra khi thêm kích thước.';
                $scope.messageType = 'error';
            });
    };
    
    // Hàm chỉnh sửa kích thước
    $scope.editSize = function(size) {
        $scope.selectedSize = angular.copy(size);  // Sao chép dữ liệu kích thước vào form
        $scope.isEditMode = true;
    
        // Kích hoạt tab "Chỉnh sửa"
        var editTab = document.getElementById('edit-tab');
        var tab = new bootstrap.Tab(editTab); // Sử dụng Bootstrap Tab
        tab.show();  // Hiển thị tab "Chỉnh sửa"
    };
    

    // Hàm cập nhật kích thước
    $scope.updateSize = function() {
        $http.put('http://localhost:8080/beesixcake/api/size/' + $scope.selectedSize.idsize, $scope.selectedSize)
            .then(function(response) {
                $scope.message = 'Cập nhật kích thước thành công!';
                $scope.messageType = 'success';
                $scope.loadSizes();  // Tải lại danh sách
                $scope.isEditMode = false;  // Tắt chế độ chỉnh sửa
                $scope.selectedSize = {};  // Reset form
            })
            .catch(function(error) {
                $scope.message = 'Có lỗi xảy ra khi cập nhật kích thước.';
                $scope.messageType = 'error';
            });
    };

    // Hàm xóa kích thước
    $scope.deleteSize = function(idsize) {
        if (confirm('Bạn có chắc chắn muốn xóa kích thước này?')) {
            $http.delete('http://localhost:8080/beesixcake/api/size/' + idsize)
                .then(function(response) {
                    $scope.message = 'Xóa kích thước thành công!';
                    $scope.messageType = 'success';
                    $scope.loadSizes();  // Tải lại danh sách
                })
                .catch(function(error) {
                    $scope.message = 'Có lỗi xảy ra khi xóa kích thước.';
                    $scope.messageType = 'error';
                });
        }
    };

    // Tải danh sách kích thước khi khởi tạo
    $scope.loadSizes();
});
