import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ConfigService } from '@gsrs-core/config';
import { BaseHttpService } from '@gsrs-core/base';
import { PagingResponse } from '@gsrs-core/utils';
import { UtilsService } from '@gsrs-core/utils/utils.service';
import { Facet } from '@gsrs-core/facets-manager';
import { FacetParam, FacetHttpParams, FacetQueryResponse } from '@gsrs-core/facets-manager';
import { Product, ProductName, ProductTermAndPart, ProductCode, ProductAll } from '../model/product.model';
import { ProductCompany, ProductComponent, ProductLot, ProductIngredient } from '../model/product.model';
import { ValidationResults } from '../model/product.model';

@Injectable()
export class ProductService extends BaseHttpService {

  private _bypassUpdateCheck = false;
  private productStateHash?: number;
  totalRecords = 0;
  product: Product;

  apiBaseUrlWithProductEntityUrl = this.apiBaseUrl + 'products' + '/';
  apiBaseUrlWithProductBrowseEntityUrl = this.apiBaseUrl + 'productsall' + '/';
  apiBaseUrlWithProductElistEntityUrl = this.apiBaseUrl + 'productselist' + '/';

  constructor(
    public http: HttpClient,
    public configService: ConfigService,
    public utilsService: UtilsService
  ) {
    super(configService);
  }

  getProducts(
    order: string,
    skip: number = 0,
    pageSize: number = 10,
    searchTerm?: string,
    facets?: FacetParam
  ): Observable<PagingResponse<ProductAll>> {
    let params = new FacetHttpParams();
    params = params.append('skip', skip.toString());
    params = params.append('top', pageSize.toString());
    if (searchTerm !== null && searchTerm !== '') {
      params = params.append('q', searchTerm);
    }

    params = params.appendFacetParams(facets);

    if (order != null && order !== '') {
      params = params.append('order', order);
    }

    const url = this.apiBaseUrlWithProductBrowseEntityUrl + 'search';
    const options = {
      params: params
    };

    return this.http.get<PagingResponse<ProductAll>>(url, options);
  }

  getProductFacets(facet: Facet, searchTerm?: string, nextUrl?: string): Observable<FacetQueryResponse> {
    let url: string;
    if (searchTerm) {
      url = this.apiBaseUrlWithProductBrowseEntityUrl + `search/@facets?wait=false&kind=gov.hhs.gsrs.products.productall.models.ProductMainAll&skip=0&fdim=200&sideway=true&field=${facet.name.replace(' ', '+')}&top=14448&fskip=0&fetch=100&termfilter=SubstanceDeprecated%3Afalse&order=%24lastEdited&ffilter=${searchTerm}`;
    } else if (nextUrl != null) {
      url = nextUrl;
    } else {
      url = facet._self;
    }
    return this.http.get<FacetQueryResponse>(url);
  }

  filterFacets(name: string, category: string): Observable<any> {
    const url = this.apiBaseUrlWithProductBrowseEntityUrl + `search/@facets?wait=false&kind=gov.hhs.gsrs.products.productall.models.ProductMainAll&skip=0&fdim=200&sideway=true&field=${category}&top=14448&fskip=0&fetch=100&order=%24lastUpdated&ffilter=${name}`;
    return this.http.get(url);
  }

  retrieveFacetValues(facet: Facet): Observable<any> {
    const url = facet._self;
    return this.http.get<any>(url);
  }

  retrieveNextFacetValues(facet: Facet): Observable<any> {
    const url = facet._self;
    if (!facet.$next) {
      return this.http.get<any>(url).pipe(
        switchMap(response => {
          if (response) {
            const next = response.nextPageUri;
            return this.http.get<any>(next);
          } else {
            return 'nada';
          }
        }));
    } else {
      return this.http.get<any>(facet.$next);
    }
  }

  getApiExportUrl(etag: string, extension: string): string {
    // const url = `${this.configService.configData.apiBaseUrl}api/v1/productmainall/export/${etag}/${extension}`;
    const url = this.apiBaseUrlWithProductBrowseEntityUrl + `export/${etag}/${extension}`;
    return url;
  }

  // 2.x play framework, Will REMOVE in Future
  getProductListExportUrl(substanceId: string): string {
    return this.baseUrl + 'productListExport?substanceId=' + substanceId;
  }

  getProductProvenanceList(
    substanceUuid: string
  ): Observable<any> {

    //  const url = this.baseUrl + 'getProductProvenanceList?substanceUuid=' + substanceUuid;

    const url = this.apiBaseUrlWithProductBrowseEntityUrl + 'distprovenance/' + substanceUuid;
    return this.http.get<any>(url)
      .pipe(
        map(result => {
          return result;
        })
      );
  }

  // 2.x play framework, Will REMOVE in Future
  getSubstanceProducts(
    substanceUuid: string, provenance: string, page: number, pageSize: number
  ): Observable<Array<any>> {

    const funcName = 'productListBySubstanceUuid?substanceUuid=';
    const url = this.baseUrl + funcName + substanceUuid + '&provenance=' + provenance + '&page=' + (page + 1) + '&pageSize=' + pageSize;

    return this.http.get<Array<any>>(url)
      .pipe(
        map(results => {
          this.totalRecords = results['totalRecords'];
          return results['data'];
        })
      );
  }

  // 2.x play framework, Will REMOVE in Future
  getProductsBySubstanceUUid(
    substanceUuid: string, provenance: string, page: number, pageSize: number
  ): Observable<Array<any>> {

    const funcName = 'productListBySubstanceUuid?substanceUuid=';
    const url = this.baseUrl + funcName + substanceUuid + '&provenance=' + provenance + '&page=' + (page + 1) + '&pageSize=' + pageSize;

    return this.http.get<Array<any>>(url)
      .pipe(
        map(results => {
          this.totalRecords = results['totalRecords'];
          return results['data'];
        })
      );
  }

  // 2.x play framework, Will REMOVE in Future
  getIngredientNameByBdnum(
    bdnum: string)
    : Observable<any> {
    const url = this.baseUrl + 'getIngredientNameByBdnum?bdnum=' + bdnum;

    return this.http.get<any>(url)
      .pipe(
        map(result => {
          return result;
        })
      );
  }

  // 2.x play framework, Will REMOVE in Future
  getSubstanceDetailsByBdnum(
    bdnum: string
  ): Observable<any> {
    const url = this.baseUrl + 'getSubstanceDetailsByBdnum?bdnum=' + bdnum;
    return this.http.get<any>(url).pipe(
      map(results => {
        return results;
      })
    );
  }

  // 2.x play framework, Will REMOVE in Future
  getSubstanceDetailsBySubstanceId(
    substanceId: string
  ): Observable<any> {
    const url = this.baseUrl + 'getSubstanceDetailsBySubstanceId?substanceId=' + substanceId;
    return this.http.get<any>(url).pipe(
      map(results => {
        return results;
      })
    );
  }

  // 2.x play framework, Will REMOVE in Future
  getSubstanceRelationship(
    substanceId: string
  ): Observable<Array<any>> {
    const url = this.baseUrl + 'getRelationshipBySubstanceId?substanceId=' + substanceId;
    return this.http.get<Array<any>>(url).pipe(
      map(results => {
        return results['data'];
      })
    );
  }

  getProductElist(
    productId: string
  ): Observable<any> {
    const url = this.apiBaseUrlWithProductElistEntityUrl + productId;
    return this.http.get<any>(url)
      .pipe(
        map(result => {
          return result;
        })
      );
  }

  get isProductUpdated(): boolean {
    const productString = JSON.stringify(this.product);
    if (this._bypassUpdateCheck) {
      this._bypassUpdateCheck = false;
      return false;
    } else {
      return this.productStateHash !== this.utilsService.hashCode(productString);
    }
  }

  bypassUpdateCheck(): void {
    this._bypassUpdateCheck = true;
  }

  getProduct(productId: string, src: string): Observable<any> {
    const url = this.apiBaseUrlWithProductEntityUrl + productId;
    return this.http.get<any>(url)
      .pipe(
        map(result => {
          return result;
        })
      );
  }

  getViewProductUrl(productId: number): string {
    return this.apiBaseUrlWithProductEntityUrl + productId;
  }

  loadProduct(product?: Product): void {
    // if Update/Exist Application
    // setTimeout(() => {
    if (product != null) {
      this.product = product;
    } else {
      this.product = {
        productNameList: [{}],
        productCodeList: [{}],
        productCompanyList: [{}],
        productComponentList: [{
          productLotList: [{
            productIngredientList: [{}]
          }]
        }]
      };
    }
    //  });
  }

  saveProduct(): Observable<Product> {
    const url = this.apiBaseUrlWithProductEntityUrl;
    const params = new HttpParams();
    const options = {
      params: params,
      type: 'JSON',
      headers: {
        'Content-type': 'application/json'
      }
    };
    // Update Product
    if ((this.product != null) && (this.product.id)) {
      return this.http.put<Product>(url, this.product, options);
    } else {
      // Save New Product
      return this.http.post<Product>(url, this.product, options);
    }
  }

  validateProduct(): Observable<ValidationResults> {
    return new Observable(observer => {
      this.validateProd().subscribe(results => {
        observer.next(results);
        observer.complete();
      }, error => {
        observer.error();
        observer.complete();
      });
    });
  }

  validateProd(): Observable<ValidationResults> {
    const url = this.apiBaseUrlWithProductEntityUrl + '@validate';
    return this.http.post(url, this.product);
  }

  deleteProduct(productId: number): Observable<any> {
   // const url = this.baseUrl + 'deleteProduct?productId=' + this.product.id + '&from=ang';

    const url = this.apiBaseUrlWithProductEntityUrl + '(' + productId + ')';
    const x = this.http.delete<Product>(url);
    return x;

    return this.http.delete<any>(url).pipe(
      map(results => {
        return results;
      })
    );
  }

  addNewProductName(): void {
    const newProductName: ProductName = { productTermAndTermPartList: [] };
    this.product.productNameList.unshift(newProductName);
  }

  deleteProductName(prodNameIndex: number): void {
    this.product.productNameList.splice(prodNameIndex, 1);
  }

  addNewTermAndTermPart(prodNameIndex: number): void {
    if (this.product.productNameList[prodNameIndex].productTermAndTermPartList == null) {
      this.product.productNameList[prodNameIndex].productTermAndTermPartList = [];
    }
    const newProductPartTerm: ProductTermAndPart = {};
    this.product.productNameList[prodNameIndex].productTermAndTermPartList.unshift(newProductPartTerm);
  }

  deleteTermAndTermPart(prodNameIndex: number, prodNameTermIndex: number): void {
    this.product.productNameList[prodNameIndex].productTermAndTermPartList.splice(prodNameTermIndex, 1);
  }

  addNewProductCode(): void {
    const newProductCode: ProductCode = {};
    this.product.productCodeList.unshift(newProductCode);
  }

  deleteProductCode(prodCodeIndex: number): void {
    this.product.productCodeList.splice(prodCodeIndex, 1);
  }

  addNewProductCompany(): void {
    const newProductCompany: ProductCompany = {};
    this.product.productCompanyList.unshift(newProductCompany);
  }

  deleteProductCompany(prodCompanyIndex: number): void {
    this.product.productCompanyList.splice(prodCompanyIndex, 1);
  }

  addNewProductComponent(): void {
    const newProductComponent: ProductComponent = {
      productLotList: [{
        productIngredientList: [{}]
      }]
    };
    this.product.productComponentList.unshift(newProductComponent);
  }

  deleteProductComponent(prodComponentIndex: number): void {
    this.product.productComponentList.splice(prodComponentIndex, 1);
  }

  addNewProductLot(prodComponentIndex: number): void {
    const newProductLot: ProductLot = { productIngredientList: [{}] };
    this.product.productComponentList[prodComponentIndex].productLotList.unshift(newProductLot);
  }

  deleteProductLot(prodComponentIndex: number, prodLotIndex: number): void {
    this.product.productComponentList[prodComponentIndex].productLotList.splice(prodLotIndex, 1);
  }

  addNewProductIngredient(prodComponentIndex: number, prodLotIndex: number): void {
    const newProductIngredient: ProductIngredient = {};
    this.product.productComponentList[prodComponentIndex].productLotList[prodLotIndex].productIngredientList.unshift(newProductIngredient);
  }

  deleteProductIngredient(prodComponentIndex: number, prodLotIndex: number, prodIngredientIndex: number): void {
    this.product.productComponentList[prodComponentIndex].productLotList[prodLotIndex].productIngredientList.splice(prodIngredientIndex, 1);
  }

  copyProductComponent(productComp: any): void {
    const newProduct = JSON.parse(JSON.stringify(productComp));
    /*
    newProduct.id = null;
    newProduct.createdBy = null;
    newProduct.creationDate = null;
    newProduct.createdBy = null;
    newProduct.lastModifiedDate = null;
    */
    this.product.productComponentList.unshift(newProduct);
  }

  copyProductLot(productLot: any, prodComponentIndex: number): void {
    /*
    let newProduct: any;

    newProduct = productLot;

    if (newProduct != null) {
      newProduct.id = null;
      newProduct.createdBy = null;
      newProduct.creationDate = null;
      newProduct.modifiedBy = null;
      newProduct.lastModifiedDate = null;

      newProduct.productIngredientList.forEach(elementIngred => {
        if (elementIngred != null) {
          elementIngred.id = null;
          elementIngred.createdBy = null;
          elementIngred.creationDate = null;
          elementIngred.modifiedBy = null;
          elementIngred.lastModifiedDate = null;
        }
      });
      */
    const newProduct = JSON.parse(JSON.stringify(productLot));

    this.product.productComponentList[prodComponentIndex].productLotList.unshift(newProduct);
    // }
  }

  copyProductIngredient(productIngredient: any, prodComponentIndex: number, prodLotIndex: number): void {
    const newProduct = JSON.parse(JSON.stringify(productIngredient));
    /*
    newProduct.id = null;
    newProduct.createdBy = null;
    newProduct.creationDate = null;
    newProduct.modifiedBy = null;
    newProduct.lastModifiedDate = null;
    */
    this.product.productComponentList[prodComponentIndex].productLotList[prodLotIndex].productIngredientList.unshift(newProduct);
  }

  /*
  reviewProduct(prodIndex: number): void {
   //  this.application.applicationProductList[prodIndex].applicationIngredientList.unshift(newIngredient);
 }

 addNewIngredient(index: number): void {
   const newIngredient: ApplicationIngredient = {};
   this.application.applicationProductList[index].applicationIngredientList.unshift(newIngredient);
 }

 deleteIngredient(prodIndex: number, ingredIndex: number): void {
   this.application.applicationProductList[prodIndex].applicationIngredientList.splice(ingredIndex, 1);
 }

 copyIngredient(ingredient: any, prodIndex: number): void {
   const newIngredient = JSON.parse(JSON.stringify(ingredient));
   newIngredient.reviewedBy = null;
   newIngredient.reviewDate = null;
   this.application.applicationProductList[prodIndex].applicationIngredientList.unshift(newIngredient);
 }

 reviewIngredient(prodIndex: number, ingredIndex: number): void {
   //  this.application.applicationProductList[prodIndex].applicationIngredientList.unshift(newIngredient);
 }

 getJson() {
   return this.application;
 }

 getUpdateApplicationUrl(): string {
   return this.baseUrl + 'updateApplication?applicationId=';
 }

 getApplicationListExportUrl(bdnum: string): string {
   return this.baseUrl + 'applicationListExport?bdnum=' + bdnum;
 }
*/
}
