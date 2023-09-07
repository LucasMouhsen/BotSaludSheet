import pywhatkit
from time import sleep
from unidecode import unidecode
import pyodbc
import sqlalchemy as sa
import smtplib
import re
import pandas as pd
import datetime
import time
import json

# Conexión con base de datos
con_salud = sa.create_engine('mssql+pyodbc://pbi_consultas:pbi_consultas1!@172.20.20.65/131_auxiliar?driver=SQL Server')

""" smtpObj = smtplib.SMTP("10.0.0.6",25) """

# Consulta a base de datos
consulta = f"SELECT sapt.turn_Codigo, sapt.medi_Medico ,sapt.pers_NumeroDocumento, sapt.paciCodigo ,sapt.paci_Paciente, sapt.turn_FechaTurno, sapt.turn_Fecha, sapt.ubic_Descripcion, su.ubicCalle ,su.ubicAltura , sapt.tele_Numero, sapt.nome_Descripcion FROM [131_auxiliar].dbo.salud_atencion_pacientes_turnos sapt LEFT JOIN [131_datawherehouse].dbo.salud_ubicacion su on sapt.ubic_Codigo = SU.ubicCodigo WHERE nome_Descripcion in ('CONSULTA NEUROLOGIA','CONSULTA NEUROLOGIA INFANTIL','CONSULTA DIABETOLOGICA','CONSULTA ENDOCRINOLOGICA','CONSULTA GASTROENTEROLOGIA','CONSULTA ODONTOLOGIA','CONSULTA ODONTOLOGIA - PEDIATRICA','CONSULTA ODONTOLOGIA - CIRUGIA','CONSULTA ODONTOLOGICA - ADULTOS','CONSULTA ODONTOLOGICA- ENDODONCIA GENERAL','CONSULTA ODONTOLOGICA- ENDODONCIA ADULTOS','CONSULTA ODONTOLOGICA- ORTODONCIA PEDIATRIA','CONSULTA ODONTOLÓGICA GENERAL','') AND CONVERT(DATE, turn_FechaTurno) = CONVERT(DATE, DATEADD(day, 14, GETDATE())) AND tele_Numero != '' AND sapt.paciCodigo not in (32644)"

df = pd.read_sql(consulta, con_salud)  

mensaje_base = u'Hola buenos dias {nombre}, nos contactamos de la Secretaria de Salud de la Municipalidad de San Miguel, para confirmar su asistencia al turno otorgado para {especialidad}, el dia {fechaTurno}hs en {ubicación}, {calle} {altura}.\n\nEn el caso de no poder asistir al turno asignado, recuerda cancelarlo para que pueda estar a disposicion de otro paciente. Entre todos podemos mejorar el sistema de salud.\n\nPresione 1 para CONFIRMAR.\nPresione 2 para CANCELAR.\n\nEs importante contar con tu respuesta.\nMuchas gracias.'


# Crea una función para generar el enlace con el formato correcto
def generate_link(numero):
    if numero:
        numeros = re.sub(r'\D', '', numero)
        numeros = numeros[-10:]
        link = "549"+numeros
        return link
            

nombre_archivo = "dbPy.json"

for indice, fila in df.iterrows():
    nombre = unidecode(fila['paci_Paciente']).strip()
    fechaTurno = fila['turn_FechaTurno'].strftime('%d/%m/%Y %H:%M')
    ubicación = unidecode(fila['ubic_Descripcion']).strip()
    calle = unidecode(fila['ubicCalle']).strip()
    altura = fila['ubicAltura']
    especialidad = unidecode(fila['nome_Descripcion']).strip()
    numero = generate_link(fila["tele_Numero"])
    mediMedico = unidecode(fila["medi_Medico"]).strip()
    turnCodigo = str(fila["turn_Codigo"])
    mensaje = mensaje_base.format(nombre=nombre, fechaTurno=fechaTurno, ubicación=ubicación, calle=calle, altura=altura, especialidad=especialidad, numero=numero, mediMedico=mediMedico)

    # Obtén la hora actual
    hora_actual = datetime.datetime.now()

    # Extrae la hora y los minutos de la hora actual
    hora = hora_actual.hour
    minutos = hora_actual.minute
    minutos += 1

    with open(nombre_archivo, 'r') as archivo:
        registros = json.load(archivo)

    nuevo_registro = {
        "ref": nombre,
        "keyword": fechaTurno,
        "answer": mensaje,
        "options": {},
        "from": numero,
        "refSerialize": especialidad,
        "turnCodigo": turnCodigo,
        "envio": f"{hora}:{minutos}"
    }
    # Agregar el nuevo registro a la lista existente
    registros.append(nuevo_registro)
    with open(nombre_archivo, 'w') as archivo:
        json.dump(registros, archivo, indent=2)
    
    pywhatkit.sendwhatmsg("+"+"5491131890767", mensaje, hora, minutos, tab_close=True)
    time.sleep(20)
