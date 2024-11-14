    var app = angular.module('myApp', []);

    app.controller('discountsController', function($scope, $http) {
        $scope.orderdetai = [];
        $scope.groupedOrderDetails = [];
        $scope.categories = []; // Danh sách loại sản phẩm

        // Hàm lấy dữ liệu loại sản phẩm
        $scope.getCategories = function() {
            $http.get('http://localhost:8080/beesixcake/api/category')
            .then(function(response) {
                $scope.categories = response.data; // Lưu danh sách loại sản phẩm vào biến
                $scope.getDiscounts(); // Lấy dữ liệu giảm giá sau khi đã có loại sản phẩm
            })
            .catch(function(error) {
                console.error('Error fetching categories:', error);
            });
        };

        // Hàm lấy dữ liệu sản phẩm
        $scope.getDiscounts = function() {
            $http.get('http://localhost:8080/beesixcake/api/productdetail') // Cập nhật URL API
            .then(function(response) {
                console.log(response.data); // Kiểm tra dữ liệu trả về
                $scope.orderdetai = response.data.map(function(item) {
                    return {
                        categoryName: item.product.category.categoryname, // Cập nhật đường dẫn nếu cần
                        price: item.unitprice, // Cập nhật nếu cần
                        quantityInStock: item.quantityinstock, // Cập nhật nếu cần
                        productId: item.idproduct, // Cập nhật nếu cần
                    };
                });
        
                console.log($scope.orderdetai); // Kiểm tra dữ liệu đã được xử lý
                $scope.groupData(); // Nhóm dữ liệu sau khi đã lấy thông tin
            })
            .catch(function(error) {
                console.error('Error fetching product details:', error);
            });
        };

        // Hàm nhóm dữ liệu theo loại sản phẩm
        $scope.groupData = function() {
            const statsMap = {};
        
            // Tạo một đối tượng cho mỗi loại sản phẩm
            $scope.categories.forEach(category => {
                statsMap[category.categoryname] = {
                    categoryName: category.categoryname,
                    totalQuantity:  0,
                    totalRevenue: 0,
                    price: 0,
                };
            });
        
            // Cập nhật thông tin sản phẩm từ orderdetai
            $scope.orderdetai.forEach(item => {
                if (statsMap[item.categoryName]) {
                    // Cập nhật số lượng tồn kho
                    statsMap[item.categoryName].totalQuantity += item.quantityInStock > 0 ? item.quantityInStock : 0; 
                    // Tính doanh thu
                    statsMap[item.categoryName].totalRevenue += (item.price * item.quantityInStock);
                    // Lưu giá của sản phẩm
                    statsMap[item.categoryName].price = item.price;
                }
            });
        
            // Chuyển đổi đối tượng thành mảng
            $scope.groupedOrderDetails = Object.values(statsMap);
            $scope.renderChart(); // Vẽ biểu đồ sau khi đã nhóm dữ liệu
            console.log($scope.groupedOrderDetails); // Kiểm tra dữ liệu nhóm
        };
        // Hàm vẽ biểu đồ
        $scope.renderChart = function() {
            if ($scope.groupedOrderDetails.length === 0) {
                document.getElementById("pie-chart").innerHTML = "";
                return;
            }

            var options = {
                series: $scope.groupedOrderDetails.map(item => item.totalQuantity),
                chart: {
                    width: 380,
                    type: 'pie',
                },
                labels: $scope.groupedOrderDetails.map(item => item.categoryName),
                responsive: [{
                    breakpoint: 480,
                    options: {
                        chart: {
                            width: 200
                        },
                        legend: {
                            position: 'bottom'
                        }
                    }
                }]
            };

            var chart = new ApexCharts(document.querySelector("#pie-chart"), options);
            chart.render();
        };

        // Hàm xuất dữ liệu ra Excel
        $scope.exportToExcel = function() {
            const worksheet = XLSX.utils.json_to_sheet($scope.groupedOrderDetails.map(item => ({
                'Loại Sản Phẩm': item.categoryName,
                'Giá': $scope.formatCurrency(item.price),
                'Số Lượng': item.totalQuantity,
                'Giá Trị Tồn Kho': $scope.formatCurrency(item.totalRevenue),
            })));

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");

            // Xuất file
            XLSX.writeFile(workbook, 'order_details.xlsx');
        };

        // Hàm định dạng tiền tệ
        $scope.formatCurrency = function(amount) {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
        };

        // Gọi hàm để lấy danh sách loại sản phẩm
        $scope.getCategories(); // Lấy dữ liệu loại sản phẩm
    });