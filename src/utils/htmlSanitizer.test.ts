import { describe, expect, it } from 'vitest'
import {
  createSafeHtmlRenderer,
  sanitizeCourseContent,
  sanitizeHtml,
  sanitizeLessonContent,
  sanitizeQuizContent,
  sanitizeUserInput,
  validateYouTubeUrl
} from './htmlSanitizer'

describe('sanitizeHtml: ataques que deben quedar fuera', () => {
  it('elimina <script> y conserva el resto', () => {
    expect(sanitizeHtml('<p>hola</p><script>alert(1)</script>')).toBe('<p>hola</p>')
  })

  it('quita los atributos de eventos (onerror, onclick)', () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).not.toContain('onerror')
    expect(sanitizeHtml('<p onclick="alert(1)">x</p>')).toBe('<p>x</p>')
  })

  it('bloquea enlaces javascript:, también con mayúsculas mezcladas', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe('<a>x</a>')
    expect(sanitizeHtml('<a href="JaVaScRiPt:alert(1)">x</a>')).toBe('<a>x</a>')
  })

  it('bloquea enlaces data: con HTML', () => {
    expect(
      sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>')
    ).toBe('<a>x</a>')
  })

  it('elimina svg, iframe, formularios y <style>', () => {
    expect(sanitizeHtml('<svg onload="alert(1)"><circle/></svg>')).toBe('')
    expect(sanitizeHtml('<iframe src="https://evil.com"></iframe>')).toBe('')
    expect(sanitizeHtml('<form action="x"><input name="a"></form>')).toBe('')
    expect(sanitizeHtml('<style>body{display:none}</style><p>x</p>')).toBe(
      '<p>x</p>'
    )
  })

  it('el HTML escapado no se vuelve a convertir en etiquetas', () => {
    const result = sanitizeHtml('&lt;script&gt;')
    expect(result).toBe('&lt;script&gt;')
  })
})

describe('sanitizeHtml: lo normal debe sobrevivir', () => {
  it('conserva formato, listas, enlaces https e imágenes con data:image', () => {
    const html = '<p>Hola <strong>mundo</strong></p><ul><li>uno</li></ul>'
    expect(sanitizeHtml(html)).toBe(html)
    expect(sanitizeHtml('<a href="https://a.com" target="_blank">x</a>')).toBe(
      '<a href="https://a.com" target="_blank">x</a>'
    )
    expect(sanitizeHtml('<img src="data:image/png;base64,AAAA">')).toContain(
      'data:image/png'
    )
  })

  it('richText conserva el atributo style', () => {
    expect(sanitizeHtml('<p style="color:red">x</p>')).toBe(
      '<p style="color:red">x</p>'
    )
  })
})

describe('sanitizeHtml: según el tipo de contenido', () => {
  it('basicText deja el texto de un enlace pero no el enlace', () => {
    expect(sanitizeHtml('<p>x <a href="https://a.com">l</a></p>', 'basicText')).toBe(
      '<p>x l</p>'
    )
  })

  it('quiz solo permite negrita, cursiva, subrayado y salto de línea', () => {
    expect(sanitizeHtml('<h1>t</h1><strong>b</strong><em>i</em>', 'quiz')).toBe(
      't<strong>b</strong><em>i</em>'
    )
  })

  it('plainText quita todo el HTML y conserva el texto', () => {
    expect(
      sanitizeHtml('<p>hola <b>x</b></p><script>1</script>', 'plainText')
    ).toBe('hola x')
  })

  it('un valor vacío o que no es texto devuelve cadena vacía', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(sanitizeHtml(null as unknown as string)).toBe('')
    expect(sanitizeHtml(5 as unknown as string)).toBe('')
  })
})

describe('sanitizadores de contenido del LMS', () => {
  it('curso: título con formato básico, descripción y objetivos con formato limpio', () => {
    const result = sanitizeCourseContent({
      title: '<strong>Curso</strong><script>x</script>',
      description: '<p>d</p><script>x</script>',
      objectives: '<ul><li onclick="x">o</li></ul>',
      slug: 'sin-tocar'
    })
    expect(result.title).toBe('<strong>Curso</strong>')
    expect(result.description).toBe('<p>d</p>')
    expect(result.objectives).toBe('<ul><li>o</li></ul>')
    expect(result.slug).toBe('sin-tocar')
  })

  it('lección: limpia título, descripción y contenido', () => {
    const result = sanitizeLessonContent({
      title: 'T',
      description: '<p>d</p>',
      content: '<p>c</p><img src="x" onerror="x">'
    })
    expect(result.content).not.toContain('onerror')
    expect(result.content).toContain('<p>c</p>')
  })

  it('quiz: limpia preguntas, opciones y explicaciones sin tocar el resto', () => {
    const result = sanitizeQuizContent({
      title: 'Q',
      questions: [
        {
          id: 7,
          question: '<strong>¿Cuál?</strong><script>x</script>',
          explanation: '<p>porque</p><script>x</script>',
          options: ['<em>a</em>', '<img src=x onerror=x>']
        }
      ]
    })
    const [question] = result.questions
    expect(question.id).toBe(7)
    expect(question.question).toBe('<strong>¿Cuál?</strong>')
    expect(question.explanation).toBe('<p>porque</p>')
    expect(question.options[0]).toBe('<em>a</em>')
    expect(question.options[1]).not.toContain('onerror')
  })

  it('valores nulos pasan sin fallar', () => {
    expect(sanitizeCourseContent(null)).toBeNull()
    expect(sanitizeLessonContent(undefined)).toBeUndefined()
    expect(sanitizeQuizContent(null)).toBeNull()
  })
})

describe('createSafeHtmlRenderer', () => {
  it('devuelve el objeto que espera dangerouslySetInnerHTML, ya limpio', () => {
    expect(createSafeHtmlRenderer('<p>x</p><script>y</script>')).toEqual({
      __html: '<p>x</p>'
    })
  })
})

describe('validateYouTubeUrl', () => {
  it('acepta youtube.com/watch y youtu.be con id de 11 caracteres', () => {
    expect(validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      isValid: true,
      cleanUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    })
    expect(validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ').isValid).toBe(true)
  })

  it('ignora los espacios alrededor', () => {
    expect(validateYouTubeUrl('  https://youtu.be/dQw4w9WgXcQ  ').cleanUrl).toBe(
      'https://youtu.be/dQw4w9WgXcQ'
    )
  })

  it('rechaza otros dominios, ids cortos y URLs con intentos de inyección', () => {
    expect(validateYouTubeUrl('https://evil.com/watch?v=dQw4w9WgXcQ').isValid).toBe(false)
    expect(validateYouTubeUrl('https://www.youtube.com/watch?v=corto').isValid).toBe(false)
    expect(validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ"><script>').isValid).toBe(false)
  })

  it('rechaza vacío o valores que no son texto', () => {
    expect(validateYouTubeUrl('').isValid).toBe(false)
    expect(validateYouTubeUrl(undefined as unknown as string).isValid).toBe(false)
  })
})

describe('sanitizeUserInput', () => {
  it('quita caracteres de control y recorta espacios', () => {
    expect(sanitizeUserInput('  hola\u0000\u0007 mundo\n ')).toBe('hola mundo')
  })

  it('limita el largo a 10 000 caracteres', () => {
    expect(sanitizeUserInput('a'.repeat(10050))).toHaveLength(10000)
  })

  it('un valor vacío o que no es texto devuelve cadena vacía', () => {
    expect(sanitizeUserInput('')).toBe('')
    expect(sanitizeUserInput(null as unknown as string)).toBe('')
  })
})
