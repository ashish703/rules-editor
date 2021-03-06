import { NestedTreeControl } from '@angular/cdk/tree';
import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { CodeEditorService, CodeModel } from '@ngstack/code-editor';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { FileDatabase } from './file-database';
import { FileNode, FileNodeType } from './file-node';

@Component({
  selector: 'app-code-editor-demo',
  templateUrl: './code-editor-demo.component.html',
  styleUrls: ['./code-editor-demo.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [FileDatabase],
})
export class CodeEditorDemoComponent implements OnInit {
  nestedTreeControl: NestedTreeControl<FileNode>;
  nestedDataSource: MatTreeNestedDataSource<FileNode>;

  themes = [
    { name: 'Visual Studio', value: 'vs' },
    { name: 'Visual Studio Dark', value: 'vs-dark' },
    { name: 'High Contrast Dark', value: 'hc-black' },
  ];

  selectedModel: CodeModel = null;
  activeTheme = 'vs-dark';
  readOnly = false;
  isLoading = false;
  isLoading$: Observable<boolean>;

  @ViewChild('file')
  fileInput: ElementRef;

  options = {
    contextmenu: true,
    minimap: {
      enabled: false,
    },
  };

  /*************** */

  myControl = new FormControl();
  optionsArr: string[] = ['One', 'Two', 'Three'];
  filteredOptions: Observable<string[]>;
  ruleSetTypesOptions: Observable<string[]>;

  ruleForm = this.formBuilder.group({
    mainGroup: new FormArray([])
  });

  fileForm: FormGroup;
  sourceCode = ['// JScript source code'];
  funcParams: string[] = ['param', 'Source', 'RefSourceName', 'ObjectName', 'RuleStr', 'TocID', 'SourceName', 'Rule', 'xmlString'];
  actionsArr: string[] = ['Read From Source', 'Read Shape File', 'Inset Log'];
  showFilePath = false;



  ruleSetTypes: string[] = ['Completeness', 'Correction', 'Data Changed', 'Validity'];
  dataTypes: string[] = ['WellBore', 'Dev Survey', 'Log Curve'];
  elements = [
    {
      name: 'UWI',
      attributes: []
    },
    {
      name: 'Elevation',
      attributes: ['Ref']
    },
    {
      name: 'SpudDate',
      attributes: []
    },
    {
      name: 'SurfaceLocation',
      attributes: ['Lat', 'Lon', 'LatWGS84', 'LonWGS84']
    }, {
      name: 'BottomHoleLocation',
      attributes: ['LatWGS84', 'LonWGS84']
    }
  ];
  attributes = [];
  actions = [{
    name: 'Comparision Operations',
    actions: [
      { value: '==', viewValue: '==' },
      { value: '>=', viewValue: '>=' },
      { value: '>', viewValue: '>' },
      { value: '<=', viewValue: '<=' },
      { value: '<', viewValue: '<' }
    ]
  }]






  /****************** */

  constructor(database: FileDatabase, editorService: CodeEditorService, private formBuilder: FormBuilder) {
    this.nestedTreeControl = new NestedTreeControl<FileNode>(this._getChildren);
    this.nestedDataSource = new MatTreeNestedDataSource();

    database.dataChange.subscribe(
      (data) => (this.nestedDataSource.data = data)
    );

    this.isLoading$ = editorService.loadingTypings.pipe(debounceTime(300));
  }

  hasNestedChild(_: number, nodeData: FileNode): boolean {
    return nodeData.type === FileNodeType.folder;
  }

  private _getChildren = (node: FileNode) => node.children;

  onCodeChanged(value) {
    this.sourceCode = value.split('\n');
    console.log(this.sourceCode)
  }

  isNodeSelected(node: FileNode): boolean {
    return (
      node &&
      node.code &&
      this.selectedModel &&
      node.code === this.selectedModel
    );
  }

  selectNode(node: FileNode) {
    this.isLoading = false;
    console.log(node);
    this.selectedModel = node.code;
  }

  ngOnInit() {

    this.selectedModel = {
      language: 'javascript',
      uri: 'main.js',
      value: this.sourceCode.join('\n')
    };

    /******************* */

    this.fileForm = this.formBuilder.group({
      name: new FormControl('main.js'),

    });

    // this.filteredOptions = this.ruleForm.get('action').valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(this.actionsArr, value))
    // );


    // this.ruleSetTypesOptions = this.ruleForm.get('ruleSetType').valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filter(this.ruleSetTypes, value))
    // );

  }

  onEditorLoaded() {
    console.log('loaded');
  }

  /***************************** */
  private _filter(Arr, value: string): string[] {
    const filterValue = value.toLowerCase();

    return Arr.filter(option => option.toLowerCase().indexOf(filterValue) === 0);
  }

  createActionsField(control) {
    control.push(this.formBuilder.group({
      action: new FormControl(),
      staticValue: new FormControl(),
      element: new FormControl(),
      attribute: new FormControl()
    }));
  }

  // convenience getters for easy access to form fields
  get f() { return this.ruleForm.controls; }
  get mg() { return this.f.mainGroup as FormArray; }
  //get t() { return this.f.actionGroup as FormArray; }

  getActionGroup(index) {

    const con = this.mg.controls[index] as FormArray;
    // @ts-ignore
    return con.controls.actionGroup;
  }

  createFrom() {
    this.mg.push(this.formBuilder.group({
      ruleSetType: new FormControl(''),
      funcName: new FormControl(''),
      dataSource: new FormControl(''),
      dataType: new FormControl(''),
      actionGroup: new FormArray([])
    }));

    this.createActionsField(this.getActionGroup(this.mg.length - 1));

  }

  updateCode() {

    this.selectedModel = {
      language: 'javascript',
      uri: 'main.js',
      value: this.sourceCode.join('\n')
    };

  }

  createFunction(mi) {
    console.log(this.ruleForm.value)
    this.sourceCode.push(
      `function ${this.ruleForm.value.mainGroup[mi].funcName}_${this.ruleForm.value.mainGroup[mi].ruleSetType}(ObjectName,TocID,SourceName,RefSourceName,Rule,xmlString){`,

      '}'
    );

    this.updateCode();
  }

  pressEnter(event) {


  }

  ruleSetTypeSelected(event) {

  }

  // paramsSelected(event) {
  //   this.sourceCode[1] = `function ${this.ruleForm.value.mainGroup[mi].funcName}(${event.value.join(',')}){`
  //   this.updateCode();
  // }

  checkForInit() {
    let fountAt = -1;
    this.sourceCode.forEach((line, index) => {
      if (line.indexOf('function Init(') > -1) {
        fountAt = index;
      }
    });
    if (fountAt === -1) {
      this.sourceCode.forEach((line, index) => {
        if (line.indexOf('function') > -1) {
          fountAt = index;
        }
      });

      this.sourceCode.splice(fountAt, 0, 'function Init(){', '}');
      this.updateCode();
    }
    fountAt++;
    return fountAt;
  }


  dataSourceAdded(mi) {

    this.sourceCode.splice(
      1,
      0,
      `var g_Source_${mi + 1} = '${this.ruleForm.value.mainGroup[mi].dataSource}';`
    );

    if (!mi) {
      this.sourceCode.splice(
        1,
        0,
        'var g_ASILog;',
        'var g_xmlDoc;',
      );
      const foundAt = this.checkForInit();
      this.sourceCode.splice(
        foundAt,
        0,
        ' g_ASILog = new ActiveXObject("ILXDisp.ILXLog");',
        ' g_xmlDoc = new ActiveXObject("Msxml2.DOMDocument");',
        ' g_xmlDoc.async = false;'
      );
    }

    this.updateCode();
  }

  dataTypeSelected(event, mi) {

  }

  findMainFunction(mi) {
    let fountAt = -1;
    this.sourceCode.forEach((line, index) => {
      if (line.indexOf(`function ${this.ruleForm.value.mainGroup[mi].funcName}`) > -1) {
        fountAt = index;
      }
    });

    return fountAt;
  }

  checkGetterFunction(funcName) {
    let fountAt = -1;
    this.sourceCode.forEach((line, index) => {
      if (line.indexOf(`function Get${funcName}`) > -1) {
        fountAt = index;
      }
    });

    return fountAt > -1 ? true : false;
  }

  attributesSelected(event, mi, index) {
    console.log(this.ruleForm.value)

    if (!this.checkGetterFunction(this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, ''))) {

      this.sourceCode.splice(
        this.findMainFunction(mi),
        0,
        `
function Get${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')}(attribute) {
  var elementValue = '';
  var attValue = "";
  var temp = "";

  var tempNode = g_xmlDoc.selectSingleNode("//${this.ruleForm.value.mainGroup[mi].dataType}/${this.ruleForm.value.mainGroup[mi].actionGroup[index].element}");
  if (tempNode != null && tempNode.text != '-99999') {
    temp = tempNode.getAttribute(attribute);
    if (temp != "") {
      attValue = parseFloat(tempNode.text);
      elementValue = attValue;
    }
  }

  return elementValue;
}​​
      `

      );
      this.updateCode();
    }
  }


  actionSelected(event, mi, i) {

  }

  staticValueAdded(index, mi) {

    let adjValue = 1;
    let code = `
    g_ASILog.print(2, "[${this.ruleForm.value.mainGroup[mi].funcName}_${this.ruleForm.value.mainGroup[mi].ruleSetType}] Starting Rule");
    g_xmlDoc.loadXML(xmlString);
    if (g_xmlDoc.parseError.errorCode > 0) {
      var myErr = g_xmlDoc.parseError;
      g_ASILog.print(0, "[ERROR] ${this.ruleForm.value.mainGroup[mi].funcName}_${this.ruleForm.value.mainGroup[mi].ruleSetType} - Parse Error=" + myErr);
      return (-1);
    }


    var ${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} = Get${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')}("${this.ruleForm.value.mainGroup[mi].actionGroup[index].attribute}");
    if (${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} == ""){
      g_ASILog.print(2,"[${this.ruleForm.value.mainGroup[mi].funcName}_${this.ruleForm.value.mainGroup[mi].ruleSetType}] , ${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} null, skipping rule");
      return (-1);
    }

    if (${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} ${this.ruleForm.value.mainGroup[mi].actionGroup[index].action} ${this.ruleForm.value.mainGroup[mi].actionGroup[index].staticValue}){
      g_ASILog.print(2,"[${this.ruleForm.value.mainGroup[mi].funcName}_${this.ruleForm.value.mainGroup[mi].ruleSetType}] ,  ${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} ${this.ruleForm.value.mainGroup[mi].actionGroup[index].action} ${this.ruleForm.value.mainGroup[mi].actionGroup[index].staticValue}, passed rule");
      return (0);
    }
    `;

    if (index) {
      adjValue = 9;
      code = `
    var ${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} = Get${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')}("${this.ruleForm.value.mainGroup[mi].actionGroup[index].attribute}");
    if (${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} == ""){
      g_ASILog.print(2,"[${this.ruleForm.value.mainGroup[mi].funcName}_${this.ruleForm.value.mainGroup[mi].ruleSetType}] , ${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} null, skipping rule");
      return (-1);
    }

    if (${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} ${this.ruleForm.value.mainGroup[mi].actionGroup[index].action} ${this.ruleForm.value.mainGroup[mi].actionGroup[index].staticValue}){
      g_ASILog.print(2,"[${this.ruleForm.value.mainGroup[mi].funcName}_${this.ruleForm.value.mainGroup[mi].ruleSetType}] ,  ${this.ruleForm.value.mainGroup[mi].actionGroup[index].element.replace(/ /g, '')} ${this.ruleForm.value.mainGroup[mi].actionGroup[index].action} ${this.ruleForm.value.mainGroup[mi].actionGroup[index].staticValue}, passed rule");
      return (0);
    }
    `
    }

    this.sourceCode.splice(
      this.findMainFunction(mi) + adjValue,
      0,
      code
    );
    this.updateCode();

  }

  elementsSelected(event, mi, index) {
    if (!this.attributes[mi]) {
      this.attributes[mi] = [];
    }
    this.attributes[mi][index] = this.elements.find(ele => ele.name === event.value).attributes;
  }

  downloadFile(data: any, filename = 'download.txt', contentType = 'application/octet-stream') {

    if (!data) {
      console.error('Console.save: No data')
      return;
    }

    const blob = new Blob([data], { type: contentType }),
      e = document.createEvent('MouseEvents'),
      a = document.createElement('a');

    // FOR IE:
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
      a.download = filename;
      a.href = window.URL.createObjectURL(blob);
      a.dataset.downloadurl = [contentType, a.download, a.href].join(':');
      e.initEvent('click', true, false);
      a.dispatchEvent(e);
    }
  }

  saveFile() {
    this.downloadFile(this.selectedModel.value, this.fileForm.value.name);
  }
}


